import { ButtonLink } from "@/components/ui/button";
import { Wrap } from "@/components/insider/story-layouts";

export default function InsiderSectionNotFound() {
  return (
    <Wrap className="py-24">
      <div className="mx-auto max-w-xl border-t-2 border-ink pt-8 text-center">
        <p className="font-display text-[15px] italic text-ink-4">The Insider</p>
        <h1 className="mt-2 font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">There’s no section by that name</h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[15.5px] leading-relaxed text-ink-3">Every section of the issue is listed on the front page.</p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/insider">Back to The Insider</ButtonLink>
        </div>
      </div>
    </Wrap>
  );
}
