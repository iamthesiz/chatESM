// @ts-nocheck
// Almost entirely copy and pasted from molstar source code

import { Structure } from "molstar/lib/mol-model/structure";
import { to_mmCIF } from "molstar/lib/mol-model/structure/export/mmcif";
import { PluginStateObject as PSO } from "molstar/lib/mol-plugin-state/objects";
import { PluginUIComponent } from "molstar/lib/mol-plugin-ui/base";
import { HelpOutlineSvg, Icon } from "molstar/lib/mol-plugin-ui/controls/icons";
import {
  SequenceView,
  getChainOptions,
  getModelEntityOptions,
  getOperatorOptions,
  getSequenceWrapper,
  getStructureOptions,
} from "molstar/lib/mol-plugin-ui/sequence";
import { SequenceWrapper } from "molstar/lib/mol-plugin-ui/sequence/wrapper";
import { StateSelection } from "molstar/lib/mol-state/state/selection";
import { ParamDefinition as PD } from "molstar/lib/mol-util/param-definition";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ArchiveIcon,
  DownloadIcon,
  MagicWandIcon,
  Pencil1Icon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import { Button, IconButton } from "@radix-ui/themes";
import { OrderedSet } from "molstar/lib/mol-data/int";
import { EveryLoci } from "molstar/lib/mol-model/loci";
import {
  StructureElement,
  StructureProperties,
  Unit,
} from "molstar/lib/mol-model/structure";
import { ParamProps } from "molstar/lib/mol-plugin-ui/controls/parameters";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import { Representation } from "molstar/lib/mol-repr/representation";
import { arrayEqual } from "molstar/lib/mol-util";
import { Color } from "molstar/lib/mol-util/color";
import {
  ButtonsType,
  ModifiersKeys,
  getButton,
  getButtons,
  getModifiers,
} from "molstar/lib/mol-util/input/input-observer";
import { MarkerAction } from "molstar/lib/mol-util/marker-action";
import * as React from "react";
import { Subject, Subscription } from "rxjs";
import { throttleTime } from "rxjs/operators";
import { COLOR_DISPLAY_NAMES, ColoringScheme } from "~/consts";
import { cn } from "../ui/utils";

type SequenceProps = {
  sequenceWrapper: SequenceWrapper.Any;
  sequenceNumberPeriod?: number;
  hideSequenceNumbers?: boolean;
};
const MaxSequenceWrappersCount = 30;

export type SequenceViewMode = "single" | "polymers" | "all";
const SequenceViewModeParam = PD.Select<SequenceViewMode>("single", [
  ["single", "Chain"],
  ["polymers", "Polymers"],
  ["all", "Everything"],
]);

export const COLOR_BY_SASA_CONFIG = PluginConfig.item("viewer.color-by-sasa");
export const COLOR_BY_SS_CONFIG = PluginConfig.item("viewer.color-by-ss");
export const INVERSE_FOLD_TOOL_ONCLICK = PluginConfig.item(
  "viewer.inverse-fold-onclick",
);
export const SHOW_SEQUENCE_COMPONENT = PluginConfig.item(
  "viewer.show-sequence-component",
);
export const DOWNLOAD_ALL_ONCLICK = PluginConfig.item(
  "viewer.download-all-onclick",
);
export const SET_MOLECULE_INDEX_TO_SHOW = PluginConfig.item(
  "viewer.set-molecule-index-to-show",
);

export const ActiveColorSchemeStateKey = "active-color-scheme-state";
export const StructureRefStateKey = "structure-ref-state";
export const MoleculeIndexToShowStateKey = "molecule-index-to-show";

type SequenceViewState = {
  structureOptions: { options: [string, string][]; all: Structure[] };
  structure: Structure;
  structureRef: string;
  modelEntityId: string;
  chainGroupId: number;
  operatorKey: string;
  mode: SequenceViewMode;
  sequenceViewModeParam: typeof SequenceViewModeParam;
};

export class SequenceViewCustom extends PluginUIComponent<
  { defaultMode?: SequenceViewMode },
  SequenceViewState
> {
  state: SequenceViewState = {
    structureOptions: { options: [], all: [] },
    structure: Structure.Empty,
    structureRef: "",
    modelEntityId: "",
    chainGroupId: -1,
    operatorKey: "",
    mode: "single",
    sequenceViewModeParam: SequenceViewModeParam,
  };

  private colorSchemeSub?: Subscription;

  componentDidMount() {
    if (
      this.plugin.state.data.select(
        StateSelection.Generators.rootsOfType(PSO.Molecule.Structure),
      ).length > 0
    )
      this.setState(this.getInitialState());

    this.subscribe(this.plugin.state.events.object.updated, ({ ref, obj }) => {
      if (
        ref === this.state.structureRef &&
        obj &&
        obj.type === PSO.Molecule.Structure.type &&
        obj.data !== this.state.structure
      ) {
        this.sync();
      }
    });

    this.subscribe(this.plugin.state.events.object.created, ({ obj }) => {
      if (obj && obj.type === PSO.Molecule.Structure.type) {
        this.sync();
      }
    });

    this.subscribe(this.plugin.state.events.object.removed, ({ obj }) => {
      if (obj && obj.type === PSO.Molecule.Structure.type) {
        this.sync();
      }
    });

    const modeOptions =
      this.plugin.spec.components?.sequenceViewer?.modeOptions;
    if (modeOptions) {
      const modeSet = new Set(modeOptions);
      const sequenceViewModeParam = {
        ...SequenceViewModeParam,
        options: SequenceViewModeParam.options.filter(([firstItem]) =>
          modeSet.has(firstItem),
        ),
      };
      this.setState({ sequenceViewModeParam: sequenceViewModeParam });
    }

    const customState = this.plugin.customState as any;
    this.colorSchemeSub = customState[ActiveColorSchemeStateKey]?.subscribe(
      () => {
        this.setState({});
      },
    );
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.colorSchemeSub?.unsubscribe();
  }

  private sync() {
    const structureOptions = getStructureOptions(this.plugin.state.data);
    if (arrayEqual(structureOptions.all, this.state.structureOptions.all))
      return;
    this.setState(this.getInitialState());
  }

  private getStructure(ref: string) {
    const state = this.plugin.state.data;
    const cell = state.select(ref)[0];
    if (!ref || !cell || !cell.obj) return Structure.Empty;
    return (cell.obj as PSO.Molecule.Structure).data;
  }

  private getSequenceWrapper(params: SequenceView["params"]) {
    return {
      wrapper: getSequenceWrapper(
        this.state,
        this.plugin.managers.structure.selection,
      ),
      label: `${PD.optionLabel(params.chain, this.state.chainGroupId)} | ${PD.optionLabel(params.entity, this.state.modelEntityId)}`,
    };
  }

  private getSequenceWrappers(params: SequenceView["params"]) {
    if (this.state.mode === "single") return [this.getSequenceWrapper(params)];

    const structure = this.getStructure(this.state.structureRef);
    const wrappers: { wrapper: string | SequenceWrapper.Any; label: string }[] =
      [];

    for (const [modelEntityId, eLabel] of getModelEntityOptions(
      structure,
      this.state.mode === "polymers",
    )) {
      for (const [chainGroupId, cLabel] of getChainOptions(
        structure,
        modelEntityId,
      )) {
        for (const [operatorKey] of getOperatorOptions(
          structure,
          modelEntityId,
          chainGroupId,
        )) {
          wrappers.push({
            wrapper: getSequenceWrapper(
              {
                structure,
                modelEntityId,
                chainGroupId,
                operatorKey,
              },
              this.plugin.managers.structure.selection,
            ),
            label: `${cLabel} | ${eLabel}`,
          });
          if (wrappers.length > MaxSequenceWrappersCount) return [];
        }
      }
    }
    return wrappers;
  }

  private getInitialState(): SequenceViewState {
    const structureOptions = getStructureOptions(this.plugin.state.data);
    const structureRef = structureOptions.options[0]?.[0]!;
    const structure = this.getStructure(structureRef);
    let modelEntityId = getModelEntityOptions(structure)[0]?.[0]!;
    let chainGroupId = getChainOptions(structure, modelEntityId)[0]?.[0]!;
    let operatorKey = getOperatorOptions(
      structure,
      modelEntityId,
      chainGroupId,
    )[0]?.[0]!;
    if (this.state.structure && this.state.structure === structure) {
      modelEntityId = this.state.modelEntityId;
      chainGroupId = this.state.chainGroupId;
      operatorKey = this.state.operatorKey;
    }
    const defaultMode =
      this.plugin.spec.components?.sequenceViewer?.defaultMode;
    const initialMode = this.props.defaultMode ?? defaultMode ?? "single";
    return {
      structureOptions,
      structure,
      structureRef,
      modelEntityId,
      chainGroupId,
      operatorKey,
      mode: initialMode,
      sequenceViewModeParam: this.state.sequenceViewModeParam,
    };
  }

  private get params() {
    const { structureOptions, structure, modelEntityId, chainGroupId } =
      this.state;
    const entityOptions = getModelEntityOptions(structure);
    const chainOptions = getChainOptions(structure, modelEntityId);
    const operatorOptions = getOperatorOptions(
      structure,
      modelEntityId,
      chainGroupId,
    );
    return {
      structure: PD.Select(
        structureOptions.options[0]?.[0]!,
        structureOptions.options,
        { shortLabel: true },
      ),
      entity: PD.Select(entityOptions[0]?.[0]!, entityOptions, {
        shortLabel: true,
      }),
      chain: PD.Select(chainOptions[0]?.[0]!, chainOptions, {
        shortLabel: true,
        twoColumns: true,
        label: "Chain",
      }),
      operator: PD.Select(operatorOptions[0]?.[0]!, operatorOptions, {
        shortLabel: true,
        twoColumns: true,
      }),
      mode: this.state.sequenceViewModeParam,
    };
  }

  private get values(): PD.Values<SequenceView["params"]> {
    return {
      structure: this.state.structureRef,
      entity: this.state.modelEntityId,
      chain: this.state.chainGroupId,
      operator: this.state.operatorKey,
      mode: this.state.mode,
    };
  }

  private setParamProps = (p: {
    param: PD.Base<any>;
    name: string;
    value: any;
  }) => {
    const state = { ...this.state };
    switch (p.name) {
      case "mode":
        state.mode = p.value;
        if (this.state.mode === state.mode) return;

        if (state.mode === "all" || state.mode === "polymers") {
          break;
        }
      case "structure":
        state.structureRef = p.value;
        // push state change to rxjs subject for main component
        (this.plugin.customState as any)[StructureRefStateKey]?.next(
          state.structureRef,
        );
        state.structure = this.getStructure(state.structureRef);
        state.modelEntityId = getModelEntityOptions(state.structure)[0]?.[0]!;
        state.chainGroupId = getChainOptions(
          state.structure,
          state.modelEntityId,
        )[0]?.[0]!;
        state.operatorKey = getOperatorOptions(
          state.structure,
          state.modelEntityId,
          state.chainGroupId,
        )[0]?.[0]!;
        break;
      case "entity":
        state.modelEntityId = p.value;
        state.chainGroupId = getChainOptions(
          state.structure,
          state.modelEntityId,
        )[0]?.[0]!;
        state.operatorKey = getOperatorOptions(
          state.structure,
          state.modelEntityId,
          state.chainGroupId,
        )[0]?.[0]!;
        break;
      case "chain":
        state.chainGroupId = p.value;
        state.operatorKey = getOperatorOptions(
          state.structure,
          state.modelEntityId,
          state.chainGroupId,
        )[0]?.[0]!;
        break;
      case "operator":
        state.operatorKey = p.value;
        break;
    }
    this.setState(state);
  };

  changeColoringScheme = async (scheme: ColoringScheme) => {
    (this.plugin.customState as any)[ActiveColorSchemeStateKey]?.next(scheme);

    this.plugin.dataTransaction(async () => {
      for (const s of this.plugin.managers.structure.hierarchy.current
        .structures) {
        await this.plugin.managers.structure.component.updateRepresentationsTheme(
          s.components,
          { color: scheme as any },
        );
      }
    });
  };

  resetCamera = async () => {
    await PluginCommands.Camera.Reset(this.plugin, {
      durationMs: 250,
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
    await PluginCommands.Camera.ResetAxes(this.plugin, {
      durationMs: 250,
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
  };
  downloadMmcif = async () => {
    const structures =
      this.plugin.managers.structure.hierarchy.current.structures;
    for (const [i, _s] of structures.entries()) {
      const s = _s.transform?.cell.obj?.data ?? _s.cell.obj?.data;
      const mmcif = to_mmCIF("Forge-generated structure", s!);
      const blob = new Blob([mmcif], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `structure-${i + 1}.cif`;
      a.click();
    }
  };

  render() {
    if (this.getStructure(this.state.structureRef) === Structure.Empty) {
      return (
        <div className="msp-sequence">
          <div className="msp-sequence-select">
            <Icon
              svg={HelpOutlineSvg}
              style={{ cursor: "help", position: "absolute", right: 0, top: 0 }}
              title="Shows a sequence of one or more chains. Use the controls to alter selection."
            />

            <span>Sequence</span>
            <span style={{ fontWeight: "normal" }}>No structure available</span>
          </div>
        </div>
      );
    }

    const params = this.params;
    const values = this.values;
    const sequenceWrappers = this.getSequenceWrappers(params);
    const activeColorScheme =
      (this.plugin.customState as any)[ActiveColorSchemeStateKey]?.value ??
      ColoringScheme.PLDDT;

    const inverseFoldOnclick = this.plugin.config.get(
      INVERSE_FOLD_TOOL_ONCLICK,
    ) as (e: any) => Promise<void>;

    const supportedColorSchemes = [ColoringScheme.PLDDT];

    const isSasaColoringEnabled = this.plugin.config.get(COLOR_BY_SASA_CONFIG);
    const isSsColoringEnabled = this.plugin.config.get(COLOR_BY_SS_CONFIG);
    if (isSasaColoringEnabled) {
      supportedColorSchemes.push(ColoringScheme.SASA);
    }
    if (isSsColoringEnabled) {
      supportedColorSchemes.push(ColoringScheme.SS);
    }

    const showSequenceComponent = this.plugin.config.get(
      SHOW_SEQUENCE_COMPONENT,
    );
    const downloadAllOnClick = this.plugin.config.get(
      DOWNLOAD_ALL_ONCLICK,
    ) as () => Promise<void>;

    const setMoleculeIndexToShow = this.plugin.config.get(
      SET_MOLECULE_INDEX_TO_SHOW,
    ) as (index: number) => void;

    const moleculeIndexToShow =
      (this.plugin.customState as any)[MoleculeIndexToShowStateKey]?.value ?? 0;

    const trajectories =
      this.plugin.managers.structure.hierarchy.current.trajectories;

    const structureParam = {
      options: trajectories.map(
        (t, i) => [(i + 1).toString(), t.cell.obj?.label!] as const,
      ),
      all: trajectories.map((t) => t.cell.obj!),
    };

    const structureParamSelect = PD.Select(
      structureParam.options[0]?.[0]!,
      structureParam.options,
      {
        shortLabel: true,
      },
    );

    return (
      <div
        className={cn(
          showSequenceComponent ? "via-95%" : "via-90% pb-2",
          "msp-sequence bg-gradient-to-b from-white via-white !h-[155px] !overflow-y-scroll",
        )}
      >
        <div className="flex flex-row justify-between">
          <div className="msp-sequence-select flex flex-row gap-2 items-center">
            <PureSelectControl
              title={`[Structure] ${PD.optionLabel(params.structure, values.structure)}`}
              param={structureParamSelect}
              name="structure"
              value={moleculeIndexToShow}
              // labels are 1-indexed while actual index is 0-indexed
              onChange={(e) => setMoleculeIndexToShow(parseInt(e.value) - 1)}
            />
            {values.mode === "single" && (
              <PureSelectControl
                title={`[Chain] ${PD.optionLabel(params.chain, values.chain)}`}
                param={params.chain}
                name="chain"
                value={values.chain}
                onChange={this.setParamProps}
              />
            )}
            {params.operator.options.length > 1 && (
              <>
                <PureSelectControl
                  title={`[Instance] ${PD.optionLabel(params.operator, values.operator)}`}
                  param={params.operator}
                  name="operator"
                  value={values.operator}
                  onChange={this.setParamProps}
                />
              </>
            )}
          </div>
          <div className="flex flex-row gap-2 viewport-controls-custom w-18">
            <IconButton
              onClick={this.resetCamera}
              variant="soft"
              className="py-3 !bg-blueA-3"
              title="Reset"
            >
              <UpdateIcon className="w-4 h-4 text-blueA-11" />
            </IconButton>
            <Menu as="div" className="relative">
              <MenuButton>
                <IconButton
                  onClick={() => { }}
                  variant="soft"
                  className="py-3"
                  title="Color by"
                >
                  <Pencil1Icon className="w-4 h-4 text-blueA-11" />
                </IconButton>
              </MenuButton>
              <MenuItems className="absolute right-0 mt-1 w-24 p-2 gap-1 text-sm origin-top-right bg-white dark:bg-zinc-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                {COLOR_DISPLAY_NAMES.filter(({ scheme }) =>
                  supportedColorSchemes.includes(scheme),
                ).map(({ scheme, displayName }) => (
                  <MenuItem key={scheme}>
                    <Button
                      onClick={() =>
                        this.changeColoringScheme(scheme as ColoringScheme)
                      }
                      variant="ghost"
                      className={cn(
                        "w-full justify-start flex flex-row",
                        activeColorScheme === scheme ? "!font-medium" : "",
                      )}
                    >
                      {displayName}
                    </Button>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
            <IconButton
              onClick={this.downloadMmcif}
              variant="soft"
              title="Download PDB"
            >
              <DownloadIcon className="w-4 h-4 text-blueA-11" />
            </IconButton>
            {!!inverseFoldOnclick && (
              <IconButton
                onClick={inverseFoldOnclick}
                variant="soft"
                title="Inverse fold"
              >
                <MagicWandIcon className="w-4 h-4 text-blueA-11" />
              </IconButton>
            )}
            {!!downloadAllOnClick && (
              <IconButton
                onClick={(e) => {
                  e.preventDefault();
                  downloadAllOnClick();
                }}
                variant="soft"
                title="Download all"
              >
                <ArchiveIcon className="w-4 h-4 text-blueA-11" />
              </IconButton>
            )}
          </div>
        </div>

        <div className={showSequenceComponent ? "" : "hidden"}>
          <NonEmptySequenceWrapper>
            {sequenceWrappers.map((s, i) => {
              const elem =
                typeof s.wrapper === "string" ? (
                  <div key={i} className="msp-sequence-wrapper">
                    {s.wrapper}
                  </div>
                ) : (
                  <Sequence key={i} sequenceWrapper={s.wrapper} />
                );
              if (values.mode === "single") return elem;
              return (
                <div key={i}>
                  <div className="msp-sequence-chain-label">{s.label}</div>
                  {elem}
                </div>
              );
            })}
          </NonEmptySequenceWrapper>
        </div>
      </div>
    );
  }
}

export class PureSelectControl extends React.PureComponent<
  ParamProps<PD.Select<string | number>> & { title?: string }
> {
  protected update(value: string | number) {
    this.props.onChange({
      param: this.props.param,
      name: this.props.name,
      value,
    });
  }

  onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (typeof this.props.param.defaultValue === "number") {
      this.update(parseInt(e.target.value, 10));
    } else {
      this.update(e.target.value);
    }
  };

  render() {
    return (
      <>
        <select
          value={
            this.props.value !== void 0
              ? String(this.props.value)
              : String(this.props.param.defaultValue)
          }
          onChange={this.onChange}
          disabled={this.props.isDisabled}
          className="bg-blueA-3 rounded-md !text-blueA-11 py-1 px-2 !text-sm !font-medium hover:cursor-pointer"
        >
          {this.props.param.options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </>
    );
  }
}

function NonEmptySequenceWrapper({ children }: { children: React.ReactNode }) {
  return <div className="msp-sequence-wrapper-non-empty">{children}</div>;
}

/** Note, if this is changed, the CSS for `msp-sequence-number` needs adjustment too */
const MaxSequenceNumberSize = 5;

const DefaultMarkerColors = {
  selected: "rgb(51, 255, 25)",
  highlighted: "rgb(255, 102, 153)",
  focused: "",
};

// TODO: this is somewhat inefficient and should be done using a canvas.
export class Sequence<P extends SequenceProps> extends PluginUIComponent<P> {
  protected parentDiv = React.createRef<HTMLDivElement>();
  protected lastMouseOverSeqIdx = -1;
  protected highlightQueue = new Subject<{
    seqIdx: number;
    buttons: number;
    button: number;
    modifiers: ModifiersKeys;
  }>();
  protected markerColors = { ...DefaultMarkerColors };

  protected lociHighlightProvider = (
    loci: Representation.Loci,
    action: MarkerAction,
  ) => {
    const changed = this.props.sequenceWrapper.markResidue(loci.loci, action);
    if (changed) this.updateMarker();
  };

  protected lociSelectionProvider = (
    loci: Representation.Loci,
    action: MarkerAction,
  ) => {
    const changed = this.props.sequenceWrapper.markResidue(loci.loci, action);
    if (changed) this.updateMarker();
  };

  protected get sequenceNumberPeriod() {
    if (this.props.sequenceNumberPeriod !== undefined) {
      return this.props.sequenceNumberPeriod as number;
    }
    if (this.props.sequenceWrapper.length > 10) return 10;
    const lastSeqNum = this.getSequenceNumber(
      this.props.sequenceWrapper.length - 1,
    );
    if (lastSeqNum.length > 1) return 5;
    return 1;
  }

  componentDidMount() {
    this.plugin.managers.interactivity.lociHighlights.addProvider(
      this.lociHighlightProvider,
    );
    this.plugin.managers.interactivity.lociSelects.addProvider(
      this.lociSelectionProvider,
    );

    this.subscribe(
      this.highlightQueue.pipe(
        throttleTime(3 * 16.666, void 0, { leading: true, trailing: true }),
      ),
      (e) => {
        const loci = this.getLoci(e.seqIdx < 0 ? void 0 : e.seqIdx);
        this.hover(loci, e.buttons, e.button, e.modifiers);
      },
    );
    this.subscribe(
      this.plugin.managers.structure.focus.behaviors.current,
      (focus) => {
        this.updateFocus(focus?.loci);
        this.updateMarker();
      },
    );

    this.updateColors();
    PluginCommands.Canvas3D.SetSettings.subscribe(this.plugin, () => {
      this.updateColors();
      this.updateMarker();
    });
  }

  updateColors() {
    if (this.plugin.canvas3d) {
      this.markerColors.highlighted = Color.toHexStyle(
        this.plugin.canvas3d.props.renderer.highlightColor,
      );
      this.markerColors.selected = Color.toHexStyle(
        this.plugin.canvas3d.props.renderer.selectColor,
      );
    } else {
      this.markerColors.highlighted = DefaultMarkerColors.highlighted;
      this.markerColors.selected = DefaultMarkerColors.selected;
    }
  }

  updateFocus(loci: StructureElement.Loci | undefined) {
    this.props.sequenceWrapper.markResidue(EveryLoci, "unfocus");
    if (loci) {
      this.props.sequenceWrapper.markResidue(loci, "focus");
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();

    this.plugin.managers.interactivity.lociHighlights.removeProvider(
      this.lociHighlightProvider,
    );
    this.plugin.managers.interactivity.lociSelects.removeProvider(
      this.lociSelectionProvider,
    );
  }

  getLoci(seqIdx: number | undefined) {
    if (seqIdx !== undefined) {
      const loci = this.props.sequenceWrapper.getLoci(seqIdx);
      if (!StructureElement.Loci.isEmpty(loci)) return loci;
    }
  }

  getSeqIdx(e: React.MouseEvent) {
    let seqIdx: number | undefined = undefined;
    const el = e.target as HTMLElement;
    if (el && el.getAttribute) {
      seqIdx = el.hasAttribute("data-seqid")
        ? +el.getAttribute("data-seqid")!
        : undefined;
    }
    return seqIdx;
  }

  hover(
    loci: StructureElement.Loci | undefined,
    buttons: ButtonsType,
    button: ButtonsType.Flag,
    modifiers: ModifiersKeys,
  ) {
    const ev = {
      current: Representation.Loci.Empty,
      buttons,
      button,
      modifiers,
    };
    if (loci !== undefined && !StructureElement.Loci.isEmpty(loci)) {
      ev.current = { loci };
      if (this.mouseDownLoci) {
        const ref = this.mouseDownLoci.elements[0]!;
        const ext = loci.elements[0]!;
        const min = Math.min(
          OrderedSet.min(ref.indices),
          OrderedSet.min(ext.indices),
        );
        const max = Math.max(
          OrderedSet.max(ref.indices),
          OrderedSet.max(ext.indices),
        );

        const range = StructureElement.Loci(loci.structure, [
          {
            unit: ref.unit,
            indices: OrderedSet.ofRange(
              min as StructureElement.UnitIndex,
              max as StructureElement.UnitIndex,
            ),
          },
        ]);
        ev.current = { loci: range };
      }
    }
    this.plugin.behaviors.interaction.hover.next(ev);
  }

  click(
    loci: StructureElement.Loci | undefined,
    buttons: ButtonsType,
    button: ButtonsType.Flag,
    modifiers: ModifiersKeys,
  ) {
    const ev = {
      current: Representation.Loci.Empty,
      buttons,
      button,
      modifiers,
    };
    if (loci !== undefined && !StructureElement.Loci.isEmpty(loci)) {
      ev.current = { loci };
    }
    this.plugin.behaviors.interaction.click.next(ev);
  }

  contextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  protected mouseDownLoci: StructureElement.Loci | undefined = undefined;

  mouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    const seqIdx = this.getSeqIdx(e);
    const loci = this.getLoci(seqIdx);
    this.mouseDownLoci = loci;
  };

  mouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();

    // ignore mouse-up events without a bound loci
    if (this.mouseDownLoci === undefined) return;

    const seqIdx = this.getSeqIdx(e);
    const loci = this.getLoci(seqIdx);

    if (loci) {
      const buttons = getButtons(e.nativeEvent);
      const button = getButton(e.nativeEvent);
      const modifiers = getModifiers(e.nativeEvent);

      let range = loci;
      if (!StructureElement.Loci.areEqual(this.mouseDownLoci, loci)) {
        const ref = this.mouseDownLoci.elements[0]!;
        const ext = loci.elements[0]!;
        const min = Math.min(
          OrderedSet.min(ref.indices),
          OrderedSet.min(ext.indices),
        );
        const max = Math.max(
          OrderedSet.max(ref.indices),
          OrderedSet.max(ext.indices),
        );

        range = StructureElement.Loci(loci.structure, [
          {
            unit: ref.unit,
            indices: OrderedSet.ofRange(
              min as StructureElement.UnitIndex,
              max as StructureElement.UnitIndex,
            ),
          },
        ]);
      }

      this.click(range, buttons, button, modifiers);
    }
    this.mouseDownLoci = undefined;
  };

  protected getResidueClass(seqIdx: number, label: string) {
    const seqWrapper = this.props.sequenceWrapper;
    if (seqWrapper.isHighlighted(seqIdx)) {
      return "msp-sequence-present !text-white !text-sm !font-mono !bg-blueA-9";
    } else if (seqWrapper.isSelected(seqIdx)) {
      return "msp-sequence-present !text-white !text-sm !font-mono !bg-blueA-9";
    } else if (seqWrapper.isFocused(seqIdx)) {
      return "msp-sequence-present !text-white !text-sm !font-mono !bg-blueA-9";
    } else {
      return "msp-sequence-present !text-gray-12 !text-sm !font-mono";
    }
  }

  protected residue(seqIdx: number, label: string) {
    return (
      <span
        key={seqIdx}
        data-seqid={seqIdx}
        className={this.getResidueClass(seqIdx, label)}
      >{`\u200b${label}\u200b`}</span>
    );
  }

  protected getSequenceNumberClass(
    seqIdx: number,
    seqNum: string,
    label: string,
  ) {
    return "msp-sequence-number !text-gray-10 !text-2xs !font-mono";
  }

  protected location = StructureElement.Location.create(void 0);
  protected getSequenceNumber(seqIdx: number) {
    let seqNum = "";
    const loci = this.props.sequenceWrapper.getLoci(seqIdx);
    const l = StructureElement.Loci.getFirstLocation(loci, this.location);
    if (l) {
      if (Unit.isAtomic(l.unit)) {
        const seqId = StructureProperties.residue.auth_seq_id(l);
        const insCode = StructureProperties.residue.pdbx_PDB_ins_code(l);
        seqNum = `${seqId}${insCode ? insCode : ""}`;
      } else if (Unit.isCoarse(l.unit)) {
        seqNum = `${seqIdx + 1}`;
      }
    }
    return seqNum;
  }

  protected padSeqNum(n: string) {
    if (n.length < MaxSequenceNumberSize)
      return n + new Array(MaxSequenceNumberSize - n.length + 1).join("\u00A0");
    return n;
  }
  protected getSequenceNumberSpan(seqIdx: number, label: string) {
    const seqNum = this.getSequenceNumber(seqIdx);
    return (
      <span
        key={`marker-${seqIdx}`}
        className={this.getSequenceNumberClass(seqIdx, seqNum, label)}
      >
        {this.padSeqNum(seqNum)}
      </span>
    );
  }

  protected updateMarker() {
    if (!this.parentDiv.current) return;
    const xs = this.parentDiv.current.children;
    const hasNumbers = !this.props.hideSequenceNumbers,
      period = this.sequenceNumberPeriod;

    const seqWrapper = this.props.sequenceWrapper;
    const seqLength = seqWrapper.length;
    let o = 0;
    for (let i = 0; i < seqLength; i++) {
      if (hasNumbers && i % period === 0 && i < seqLength) o++;
      // o + 1 to account for help icon
      const span = xs[o] as HTMLSpanElement;
      if (!span) return;
      o++;

      const className = this.getResidueClass(i, seqWrapper.residueLabel(i));
      if (span.className !== className) span.className = className;
    }
  }

  mouseMove = (e: React.MouseEvent) => {
    e.stopPropagation();

    const buttons = getButtons(e.nativeEvent);
    const button = getButton(e.nativeEvent);
    const modifiers = getModifiers(e.nativeEvent);

    const el = e.target as HTMLElement;
    if (!el || !el.getAttribute) {
      if (this.lastMouseOverSeqIdx === -1) return;
      this.lastMouseOverSeqIdx = -1;
      this.highlightQueue.next({ seqIdx: -1, buttons, button, modifiers });
      return;
    }
    const seqIdx = el.hasAttribute("data-seqid")
      ? +el.getAttribute("data-seqid")!
      : -1;
    if (this.lastMouseOverSeqIdx === seqIdx) {
      return;
    } else {
      this.lastMouseOverSeqIdx = seqIdx;
      if (this.mouseDownLoci !== undefined) {
        const loci = this.getLoci(seqIdx);
        this.hover(
          loci,
          ButtonsType.Flag.None,
          ButtonsType.Flag.None,
          modifiers,
        );
      } else {
        this.highlightQueue.next({ seqIdx, buttons, button, modifiers });
      }
    }
  };

  mouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.mouseDownLoci = undefined;

    if (this.lastMouseOverSeqIdx === -1) return;
    this.lastMouseOverSeqIdx = -1;
    const buttons = getButtons(e.nativeEvent);
    const button = getButton(e.nativeEvent);
    const modifiers = getModifiers(e.nativeEvent);
    this.highlightQueue.next({ seqIdx: -1, buttons, button, modifiers });
  };

  render() {
    const sw = this.props.sequenceWrapper;

    const elems: JSX.Element[] = [];

    const hasNumbers = !this.props.hideSequenceNumbers,
      period = this.sequenceNumberPeriod;
    for (let i = 0, il = sw.length; i < il; ++i) {
      const label = sw.residueLabel(i);
      // add sequence number before name so the html element do not get separated by a line-break
      if (hasNumbers && i % period === 0 && i < il) {
        elems[elems.length] = this.getSequenceNumberSpan(i, label);
      }
      elems[elems.length] = this.residue(i, label);
    }

    // ensure the focus markers are updated after sequenceRender is recreated
    this.updateFocus(
      this.plugin.managers.structure.focus.behaviors.current.value?.loci,
    );

    // calling .updateMarker here is neccesary to ensure existing
    // residue spans are updated as react won't update them
    this.updateMarker();

    return (
      <div
        className="msp-sequence-wrapper"
        onContextMenu={this.contextMenu}
        onMouseDown={this.mouseDown}
        onMouseUp={this.mouseUp}
        onMouseMove={this.mouseMove}
        onMouseLeave={this.mouseLeave}
        ref={this.parentDiv}
      >
        {elems}
      </div>
    );
  }
}
