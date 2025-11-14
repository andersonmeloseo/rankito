import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserSettingsLayout } from '@/components/user-settings/UserSettingsLayout';
import { ProfileTab } from '@/components/user-settings/tabs/ProfileTab';
import { AccountTab } from '@/components/user-settings/tabs/AccountTab';
import { SubscriptionTab } from '@/components/user-settings/tabs/SubscriptionTab';
import { AppearanceTab } from '@/components/user-settings/tabs/AppearanceTab';
import { NotificationsTab } from '@/components/user-settings/tabs/NotificationsTab';
import { Skeleton } from '@/components/ui/skeleton';

const UserSettings = () => {
  const navigate = useNavigate();
  const { user, role, isLoading: isLoadingRole } = useRole();
  const [activeTab, setActiveTab] = useState('profile');

  const {
    profile,
    isLoading: isLoadingProfile,
    updateProfile,
    uploadAvatar,
    updatePassword,
  } = useUserProfile(user?.id);

  if (isLoadingRole || isLoadingProfile) {
    return (
      <UserSettingsLayout activeTab={activeTab} onTabChange={setActiveTab} userRole={role}>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </UserSettingsLayout>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileTab
            profile={profile}
            onUpdate={(updates) => updateProfile.mutate(updates)}
            onUploadAvatar={(file) => uploadAvatar.mutate(file)}
            isUpdating={updateProfile.isPending}
            isUploadingAvatar={uploadAvatar.isPending}
          />
        );
      case 'account':
        return (
          <AccountTab
            profile={profile}
            onUpdatePassword={(current, newPass) =>
              updatePassword.mutate({ currentPassword: current, newPassword: newPass })
            }
            isUpdating={updatePassword.isPending}
          />
        );
      case 'subscription':
        return <SubscriptionTab profile={profile} />;
      case 'appearance':
        return (
          <AppearanceTab
            profile={profile}
            onUpdate={(updates) => updateProfile.mutate(updates)}
            isUpdating={updateProfile.isPending}
          />
        );
      case 'notifications':
        return (
          <NotificationsTab
            profile={profile}
            onUpdate={(updates) => updateProfile.mutate(updates)}
            isUpdating={updateProfile.isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <UserSettingsLayout activeTab={activeTab} onTabChange={setActiveTab} userRole={role}>
      {renderActiveTab()}
    </UserSettingsLayout>
  );
};

export default UserSettings;
