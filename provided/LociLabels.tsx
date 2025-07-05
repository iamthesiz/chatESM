// @ts-nocheck
// NOTE: Mostly copied from molstar LociLables function

import { Text } from "@radix-ui/themes";
import { LociLabel } from "molstar/lib/mol-plugin-state/manager/loci-label";
import { PluginUIComponent } from "molstar/lib/mol-plugin-ui/base";

export class LociLabels extends PluginUIComponent<
  {},
  { labels: ReadonlyArray<LociLabel> }
> {
  state = { labels: [] as string[] };

  componentDidMount() {
    this.subscribe(this.plugin.behaviors.labels.highlight, (e) =>
      this.setState({ labels: e.labels }),
    );
  }

  render() {
    if (this.state.labels.length === 0) {
      return null;
    }

    return (
      <div className="msp-highlight-info !bg-white !opacity-80 !text-black">
        {this.state.labels.map((e, i) => {
          return (
            <Text
              size="2"
              className="msp-highlight-simple-row"
              key={"" + i}
              dangerouslySetInnerHTML={{ __html: e }}
            ></Text>
          );
        })}
      </div>
    );
  }
}
