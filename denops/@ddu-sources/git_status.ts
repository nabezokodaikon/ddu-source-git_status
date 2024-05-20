import {
  abortable,
} from "jsr:@std/async@0.224.0";
import {
  resolve,
} from "jsr:@std/path@0.224.0";
import {
  TextLineStream,
} from "jsr:@std/streams@0.224.0";
import {
  ActionData,
} from "https://deno.land/x/ddu_kind_file@v0.7.1/file.ts";
import {
  BaseSource,
  Item,
} from "https://deno.land/x/ddu_vim@v4.0.0/types.ts";

async function* iterLine(r: ReadableStream<Uint&Array>): AsyncIterable<string> {
  const lines = r
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  for await (const line of lines) {
    const lineStr = line as string;
    if (lineStr.length) {
      yield lineStr; 
    }
  }
}

export class Source extends BaseSource<Params> {

  override kind = "file";

  override gather(
  ): ReadableStream<Item<ActionData>[]> {
    const abortController = new AbortController();

    return new ReadableStream({
      async start(controller) {

        const proc = new Deno.Command(
          "git",
          {
            args: ["status", "-s"],
            stdout: "piped",
            stderr: "piped",
            stdin: "null",
          }
        ).spawn();

        let items: Item<ActionData>[] = [];

        try {
          for await (
            const line of abortable(
              iterLine(proc.stdout),
              abortController.signal
            )
          ) {
            const word = line.substring(3);
            const status = line.substring(0, 2);
            const path = resolve(word);
            const display = `[${status}] ${word}`;

            const item = {
              word: word,
              display: display,
              action: {
                path: path,
                isDirectory: false,
              },
              highlights: [
                {
                  name: "display",
                  hl_group: "Special",
                  col: 1,
                  width: 4,
                }
              ],
            };

            items.push(item);
          }

          if (items.length) {
            controller.enqueue(items);
          }

        } catch (e: unknown) {
          if (e instanceof DOMException) {
            return;
          } else {
            console.error(e);
          }
        } finally {
          for await (
            const m of abortable(
              iterLine(proc.stderr),
              abortController.signal,
            )
          ) {
            console.error(m);
          }

          controller.close();
        }
      },
      cancel(reason): void {
        abortController.abort(reason);
      },
    });
  }

  override params(): Params {
    return {
    };
  }
}

