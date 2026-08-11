import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { UnresolvedEndpoint } from "@/components/shared/UnresolvedEndpoint";

export default function NotFound() {
  return (
    <section className="control-grid flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden bg-[var(--color-control-black)] py-16">
      <Container className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <div>
          <Eyebrow>Error / 404</Eyebrow>
          <h1 className="mt-6 max-w-[9ch] font-display text-display font-semibold leading-[0.9] tracking-[-0.065em] text-[var(--ink)]">
            This route never reached the cloud.
          </h1>
          <p className="mt-6 max-w-[50ch] text-base leading-7 text-[var(--ink-muted)]">
            The request entered the system, but no matching endpoint exists.
            Return to a verified path.
          </p>
          <div className="mt-9">
            <Button href="/">Back to home</Button>
          </div>
        </div>
        <UnresolvedEndpoint />
      </Container>
    </section>
  );
}
