'use client';

import { UpdateProfile } from '@/features/users/components/update-profile';
import { useUser } from '@/lib/auth';

type EntryProps = {
  label: string;
  value: string;
};
const Entry = ({ label, value }: EntryProps) => (
  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5">
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
      {value}
    </dd>
  </div>
);

export const Profile = () => {
  const user = useUser();

  if (!user) return null;

  return (
    <div className="dashboard-page space-y-4 md:space-y-6">
      <div className="overflow-hidden glass-card border border-border/30">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium leading-6">
                User Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Personal details of the user.
              </p>
            </div>
            <UpdateProfile />
          </div>
        </div>
        <div className="border-t border-border-gray-400 px-4 py-5 sm:p-0">
          <dl className="divide-y divide-border-gray-400">
            <Entry label="First Name" value={user.data?.firstName ?? ''} />
            <Entry label="Last Name" value={user.data?.lastName ?? ''} />
            <Entry label="Email Address" value={user.data?.email ?? ''} />
          </dl>
        </div>
      </div>
    </div>
  );
};
