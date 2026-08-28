import { Card, Empty } from "../components/ui/ui";
import { Icon, type IconName } from "../components/Icon";

export function Placeholder({ title, icon, blurb }: { title: string; icon: IconName; blurb: string }) {
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Unlocked module</span>
          <h1>{title}</h1>
          <p>{blurb}</p>
        </div>
      </div>
      <Card>
        <Empty icon={<Icon name={icon} size={30} />} title={`${title} is enabled`} hint="This module is scaffolded and ready. Its screens plug in here without touching the rest of the app." />
      </Card>
    </>
  );
}
