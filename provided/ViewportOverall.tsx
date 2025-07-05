// @ts-nocheck
import { PluginUIComponent } from "molstar/lib/mol-plugin-ui/base";
import {
  AnimationViewportControls,
  SelectionViewportControls,
  StateSnapshotViewportControls,
  TrajectoryViewportControls,
  ViewportSnapshotDescription,
} from "molstar/lib/mol-plugin-ui/controls";
import { BackgroundTaskProgress } from "molstar/lib/mol-plugin-ui/task";
import { Toasts } from "molstar/lib/mol-plugin-ui/toast";
import { Viewport } from "molstar/lib/mol-plugin-ui/viewport";
import { LociLabels } from "./LociLabels";

export class ViewportOverall extends PluginUIComponent {
  render() {
    if (!this.plugin.spec.components?.viewport?.controls) {
      throw new Error("Viewport controls not found");
    }
    const VPControls = this.plugin.spec.components?.viewport?.controls;
    const SVPControls =
      this.plugin.spec.components?.selectionTools?.controls ||
      SelectionViewportControls;
    const SnapshotDescription =
      this.plugin.spec.components?.viewport?.snapshotDescription ||
      ViewportSnapshotDescription;

    return (
      <>
        <Viewport />
        <div className="msp-viewport-top-left-controls">
          <AnimationViewportControls />
          <TrajectoryViewportControls />
          <StateSnapshotViewportControls />
          <SnapshotDescription />
        </div>
        <SVPControls />
        <VPControls />
        <BackgroundTaskProgress />
        <div className="msp-highlight-toast-wrapper">
          <LociLabels />
          <Toasts />
        </div>
      </>
    );
  }
}
