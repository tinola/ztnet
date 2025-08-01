-- AlterTable
ALTER TABLE "OrganizationSettings" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN DEFAULT true,
ADD COLUMN     "networkCreatedNotification" BOOLEAN DEFAULT false,
ADD COLUMN     "networkCreatedTemplate" JSONB,
ADD COLUMN     "networkDeletedNotification" BOOLEAN DEFAULT false,
ADD COLUMN     "networkDeletedTemplate" JSONB,
ADD COLUMN     "nodeAddedNotification" BOOLEAN DEFAULT false,
ADD COLUMN     "nodeAddedTemplate" JSONB,
ADD COLUMN     "nodeDeletedNotification" BOOLEAN DEFAULT false,
ADD COLUMN     "nodeDeletedTemplate" JSONB,
ADD COLUMN     "nodePermanentlyDeletedNotification" BOOLEAN DEFAULT false,
ADD COLUMN     "permissionChangedNotification" BOOLEAN DEFAULT false,
ADD COLUMN     "permissionChangedTemplate" JSONB,
ADD COLUMN     "userAddedNotification" BOOLEAN DEFAULT false,
ADD COLUMN     "userAddedTemplate" JSONB,
ADD COLUMN     "userRemovedNotification" BOOLEAN DEFAULT false,
ADD COLUMN     "userRemovedTemplate" JSONB;
