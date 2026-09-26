// Every user-facing string lives here.
export const copy = {
  appName: 'Alt+Shift',
  documentTitle: (page: string) => `${page} · Alt+Shift`,

  header: {
    logoLabel: 'Alt+Shift home',
    homeLabel: 'Dashboard',
    progress: (count: number, goal: number) => `${count}/${goal} applications generated`,
    progressLabel: (count: number, goal: number) => `${count} of ${goal} applications generated`,
  },

  dashboard: {
    title: 'Applications',
    empty: 'Your generated applications will appear here...',
  },

  generator: {
    title: 'New application',
    fields: {
      jobTitle: { label: 'Job title', placeholder: 'Product manager' },
      company: { label: 'Company', placeholder: 'Apple' },
      skills: { label: 'I am good at...', placeholder: 'HTML, CSS and doing things in time' },
      details: {
        label: 'Additional details',
        placeholder: 'Describe why you are a great fit or paste your bio',
      },
    },
    charCounter: (count: number, max: number) => `${count}/${max}`,
    fieldTooLong: 'Keep it under 300 characters',
    generate: 'Generate Now',
    generating: 'Generating…',
    tryAgain: 'Try Again',
  },

  preview: {
    empty: 'Your personalized job application will appear here...',
    streamCut: 'The letter was cut short.',
    retry: 'Retry',
    retryIn: (seconds: number) => `Retry in ${seconds}s`,
    rateLimit: {
      title: 'Too many requests',
      body: (seconds: number) => `You can try again in ${seconds}s.`,
      ready: 'You can try again now.',
    },
    upstream: {
      title: 'Generation failed',
      body: 'Something went wrong on our side. Your inputs are safe.',
    },
    network: {
      title: 'You appear to be offline',
      body: 'Check your connection and try again.',
    },
  },

  letter: {
    title: (jobTitle: string, company: string) => `${jobTitle}, ${company}`,
    copy: 'Copy to clipboard',
    copied: 'Copied',
    delete: 'Delete',
  },

  goal: {
    title: 'Hit your goal',
    subtitle: 'Generate and send out couple more job applications to get hired faster',
    progress: (count: number, goal: number) => `${count} out of ${goal}`,
  },

  createNew: 'Create New',
  storageNote:
    "This browser couldn't save your latest changes. They'll be lost when you close the tab.",

  notFound: {
    title: 'Page not found',
    text: "This page doesn't exist.",
    action: 'Go to dashboard',
  },

  crash: {
    text: 'Something went wrong.',
    action: 'Reload the app',
  },
} as const;
