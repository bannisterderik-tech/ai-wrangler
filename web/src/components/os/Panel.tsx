export function Panel({
  title,
  body,
}: {
  title?: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 px-10 text-center">
      {title ? <div className="text-[13px] font-semibold">{title}</div> : null}
      <div className="max-w-[520px] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {body}
      </div>
    </div>
  );
}
