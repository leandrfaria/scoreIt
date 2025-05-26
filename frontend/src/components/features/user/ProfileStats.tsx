
interface ProfileStatsProps {
    t: any;
    followers: number;
    following: number;
  }
  
  export const ProfileStats = ({ t, followers, following }: ProfileStatsProps) => {
    return (
      <div className="flex gap-6 text-center">
        <Stat label={t("followers")} value={followers.toString()} />
        <Stat label={t("following")} value={following.toString()} />
      </div>
    );
  };
  

interface StatProps {
  label: string;
  value: string;
}

const Stat = ({ label, value }: StatProps) => (
  <div>
    <p className="text-sm text-white">{label}</p>
    <p className="text-lg font-semibold text-white">{value}</p>
  </div>
);
