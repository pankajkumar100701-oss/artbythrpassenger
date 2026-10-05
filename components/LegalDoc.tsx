import { Fragment, type ReactNode } from "react";

type Block =
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function parse(body: string): Block[] {
  const blocks: Block[] = [];
  for (const line of body.split("\n").map((l) => l.trim()).filter(Boolean)) {
    if (line.startsWith("## ")) blocks.push({ type: "h2", text: line.slice(3), id: slugify(line.slice(3)) });
    else if (line.startsWith("### ")) blocks.push({ type: "h3", text: line.slice(4) });
    else if (line.startsWith("- ")) {
      const last = blocks.at(-1);
      if (last?.type === "ul") last.items.push(line.slice(2));
      else blocks.push({ type: "ul", items: [line.slice(2)] });
    } else blocks.push({ type: "p", text: line });
  }
  return blocks;
}

/** Turns email addresses into links and "Label: text" into a bold label. */
function rich(text: string): ReactNode {
  const label = text.match(/^([A-Z][^:.]{1,40}):\s(.*)$/);
  const [head, rest] = label ? [label[1], label[2]] : [null, text];
  // split() with a capture group keeps the matched addresses at the odd indexes.
  const parts = rest.split(/([\w.+-]+@[\w-]+\.[\w.]+\w)/);
  return (
    <>
      {head && <strong>{head}: </strong>}
      {parts.map((part, i) => (
        <Fragment key={i}>{i % 2 ? <a href={`mailto:${part}`}>{part}</a> : part}</Fragment>
      ))}
    </>
  );
}

export function LegalDoc({ title, effective, body }: { title: string; effective: string; body: string }) {
  const blocks = parse(body);
  const sections = blocks.filter((b): b is Extract<Block, { type: "h2" }> => b.type === "h2");

  return (
    <div className="container legal">
      <aside className="legal-toc">
        <p className="panel-label">On this page</p>
        <ol>
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.text.replace(/^\d+\.\s*/, "")}</a>
            </li>
          ))}
        </ol>
      </aside>

      <article className="legal-body">
        <p className="eyebrow">Legal</p>
        <h1 className="display">{title}</h1>
        <p className="legal-date">Effective date: {effective}</p>
        {blocks.map((b, i) => {
          switch (b.type) {
            case "h2":
              return <h2 key={i} id={b.id}>{b.text}</h2>;
            case "h3":
              return <h3 key={i}>{b.text}</h3>;
            case "ul":
              return (
                <ul key={i}>
                  {b.items.map((item, j) => <li key={j}>{rich(item)}</li>)}
                </ul>
              );
            default:
              return <p key={i}>{rich(b.text)}</p>;
          }
        })}
      </article>
    </div>
  );
}
