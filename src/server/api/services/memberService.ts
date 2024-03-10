import { UserContext } from "~/types/ctx";
import { MemberEntity, Peers } from "~/types/local/member";
import * as ztController from "~/utils/ztApi";
import { determineConnectionStatus } from "../utils/memberUtils";
import { prisma } from "~/server/db";
import { sendWebhook } from "~/utils/webhook";
import { HookType, MemberJoined } from "~/types/webhooks";
import { throwError } from "~/server/helpers/errorHandler";
import { network_members } from "@prisma/client";

/**
 * syncMemberPeersAndStatus
 * Synchronizes the peers and connection status of the given members.
 * @param ctx - The user context.
 * @param members - An array of member entities.
 * @param peersByAddress - An array of peers grouped by address.
 */
export const syncMemberPeersAndStatus = async (
	ctx: UserContext,
	nwid: string,
	ztMembers: MemberEntity[],
) => {
	if (ztMembers.length === 0) return [];

	const updatedMembers = await Promise.all(
		ztMembers.map(async (ztMember) => {
			const peers = await ztController.peer(ctx, ztMember.address).catch(() => null);
			const dbMember = await retrieveActiveMemberFromDatabase(nwid, ztMember.id);
			const activePreferredPath = findActivePreferredPeerPath(peers);

			const flattenPeers = activePreferredPath
				? {
						physicalAddress: activePreferredPath.address || dbMember?.physicalAddress,
						...peers,
				  }
				: {};

			// Merge the data from the database with the data from Controller
			const updatedMember = {
				...dbMember,
				...ztMember,
				peers: activePreferredPath ? flattenPeers : {},
			} as MemberEntity;

			// Update the connection status
			updatedMember.conStatus = determineConnectionStatus(updatedMember);

			// Create the object with the data to be updated
			const updateData: Partial<network_members> = {
				id: updatedMember.id,
				address: updatedMember.address,
			};

			// Check if the member is connected and has peers, if so, update the lastSeen
			const memberIsOnline =
				Object.keys(updatedMember.peers).length > 0 && updatedMember.conStatus !== 0;

			// add lastSeen to updateData if the member is connected
			if (memberIsOnline) {
				updateData.lastSeen = new Date();
			}

			// update physicalAddress if the member is connected
			if (memberIsOnline && updatedMember?.peers?.physicalAddress) {
				updateData.physicalAddress = updatedMember.peers.physicalAddress;
			}

			// Update the member in the database
			const updateResult = await prisma.network_members.updateMany({
				where: { nwid: updatedMember.nwid, id: updatedMember.id },
				data: updateData,
			});

			// If the member was not found in the database, add it
			if (updateResult.count === 0) {
				await addNetworkMember(ctx, updatedMember).catch(console.error);
			}

			return updatedMember;
		}),
	);

	return updatedMembers.filter(Boolean); // Filter out any null values
};

/**
 * Determines the active preferred path from the given peers.
 *
 * @param peers - The peers object containing paths.
 * @returns The active preferred path, or undefined if not found.
 */
const findActivePreferredPeerPath = (peers: Peers) => {
	if (!peers || typeof peers !== "object" || !Array.isArray(peers.paths)) {
		return null;
	}
	const { paths } = peers;
	const res = paths.find((path) => path?.active && path?.preferred);

	return { ...res };
};

/**
 * Adds a member to the database.
 *
 * @param ctx - The context object.
 * @param member - The member entity to be added.
 * @returns A promise that resolves to the created network member.
 */
const addNetworkMember = async (ctx, member: MemberEntity) => {
	const user = await prisma.user.findFirst({
		where: {
			id: ctx.session.user.id,
		},
		select: {
			options: true,
		},
	});

	const memberData = {
		id: member.id,
		lastSeen: new Date(),
		creationTime: new Date(),
		name: user.options?.addMemberIdAsName ? member.id : null,
	};

	// check if the new member is joining a organization network
	const org = await prisma.network.findFirst({
		where: { nwid: member.nwid },
		select: { organizationId: true },
	});

	// send webhook if the new member is joining a organization network
	if (org) {
		try {
			// Send webhook
			await sendWebhook<MemberJoined>({
				hookType: HookType.NETWORK_JOIN,
				organizationId: org.organizationId,
				memberId: member.id,
				networkId: member.nwid,
			});
		} catch (error) {
			// add error messge that webhook failed
			throwError(error.message);
		}
	}

	return await prisma.network_members.create({
		data: {
			...memberData,
			nwid_ref: {
				connect: { nwid: member.nwid },
			},
		},
	});
};

/**
 * Retrieves an active member from the database based on the network ID and member ID.
 * @param nwid - The network ID.
 * @param memberId - The member ID.
 * @returns The active member object if found, otherwise null.
 */
export const retrieveActiveMemberFromDatabase = async (
	nwid: string,
	memberId: string,
) => {
	const dbMember = await prisma.network_members.findFirst({
		where: { nwid, id: memberId },
		include: { notations: { include: { label: true } } },
	});
	return dbMember && !dbMember.deleted ? dbMember : null;
};

/**
 * Fetches zombie members from the database based on the provided network ID and enriched members.
 * A zombie member is a member that has been deleted.
 *
 * @param nwid - The network ID.
 * @param enrichedMembers - An array of enriched member entities.
 * @returns An array of zombie members.
 */
export const fetchZombieMembers = async (
	nwid: string,
	enrichedMembers: MemberEntity[],
) => {
	const getZombieMembersPromises = enrichedMembers.map((member) => {
		return prisma.network_members.findFirst({
			where: {
				nwid,
				id: member.id,
				deleted: true,
			},
		});
	});

	const zombieMembers = await Promise.all(getZombieMembersPromises);
	return zombieMembers.filter(Boolean);
};
