// A ref callback for the crash heading. React mounts the panel afresh on every caught error, a
// retry that crashes again included, so it runs once per crash.
export function announceCrash(heading: HTMLHeadingElement | null) {
  heading?.focus();
}
