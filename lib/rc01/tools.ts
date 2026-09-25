import type Anthropic from "@anthropic-ai/sdk";
import { audiences, gestures, spineStageIds } from "./actions";
import { homeSections, sitePaths } from "./routes";

/**
 * Client-side tools: the model *proposes* page actions, the server validates
 * them with `parseAction` and relays them to the browser, which validates
 * again and executes. Enums are generated from the same allowlists the
 * validator uses, so schema and policy can't drift apart.
 *
 * Order is fixed (tools render first in the cached prefix - reordering would
 * invalidate the cache). `eager_input_streaming` lets the tiny inputs arrive
 * as they're generated; inputs are validated before use regardless.
 */
export const RC01_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "navigate",
    description:
      "Open another page of the portfolio in the visitor's browser, e.g. the case study you are describing. Only use when the visitor wants to see it or it clearly helps.",
    input_schema: {
      type: "object",
      properties: { path: { type: "string", enum: [...sitePaths] } },
      required: ["path"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: "scroll_to_section",
    description: "Scroll the home page to one of its sections. Only works when the visitor is on the home page (/).",
    input_schema: {
      type: "object",
      properties: { section: { type: "string", enum: [...homeSections] } },
      required: ["section"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: "highlight_spine_stage",
    description:
      "Flash one stage of the Reliability Spine diagram (or 'all') while you explain it. Visible on the home page.",
    input_schema: {
      type: "object",
      properties: { stage: { type: "string", enum: [...spineStageIds, "all"] } },
      required: ["stage"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: "gesture",
    description: "Play a short body-language animation on the RC-01 robot. Use sparingly.",
    input_schema: {
      type: "object",
      properties: { gesture: { type: "string", enum: [...gestures] } },
      required: ["gesture"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: "set_audience",
    description:
      "Record who the visitor is so the whole site (not just your answers) adapts its framing. Call at most once, only when it is clear.",
    input_schema: {
      type: "object",
      properties: { audience: { type: "string", enum: [...audiences] } },
      required: ["audience"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: "copy_email",
    description: "Copy Tarun's email address to the visitor's clipboard when they want to get in touch.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    eager_input_streaming: true,
  },
];
