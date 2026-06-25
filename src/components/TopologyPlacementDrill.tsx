import { TopologyBoard } from './TopologyBoard';
import { OFFICE, DMZ } from './topologyScenarios';

// Both topology PBQs run on the same TopologyBoard engine; only the scenario
// data differs.

export function TopologyPlacementDrill({ onBack }: { onBack?: () => void } = {}) {
  return <TopologyBoard scenario={OFFICE} onBack={onBack} />;
}

export function DmzPlacementDrill({ onBack }: { onBack?: () => void } = {}) {
  return <TopologyBoard scenario={DMZ} onBack={onBack} />;
}
