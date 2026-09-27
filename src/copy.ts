// Every user-facing string lives here.
export const copy = {
  documentTitle: (page: string) => `${page} · Alt+Shift`,

  header: {
    logoLabel: 'Alt+Shift home',
    homeLabel: 'Dashboard',
    progress: (count: number, goal: number) => `${count}/${goal}`,
    progressSuffix: 'applications generated',
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
    overLimit: (excess: number) =>
      `${excess} ${excess === 1 ? 'character' : 'characters'} over the limit`,
    fieldTooLong: (max: number) => `Keep it under ${max} characters`,
    generate: 'Generate Now',
    generating: 'Generating…',
    tryAgain: 'Try Again',
    offlineNote: "You appear to be offline. Generating will work again once you're back.",
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
    loading: {
      eyebrow: 'Generating',
      writing: (company: string) => `Writing your letter for ${company}…`,
      almost: 'Almost there…',
    },
  },

  signature: {
    add: 'Add your name',
    change: 'Change name',
    label: 'Your name',
  },

  letter: {
    title: (jobTitle: string, company: string) => `${jobTitle}, ${company}`,
    copy: 'Copy to clipboard',
    copied: 'Copied',
    copyFailed: "Couldn't copy",
    delete: 'Delete',
    readMore: 'Read more',
    showLess: 'Show less',
  },

  example: {
    label: 'Try an example',
    request: {
      jobTitle: 'Product manager',
      company: 'Apple',
      skills: 'HTML, CSS and doing things in time',
      details:
        'I want to help you build awesome solutions to accomplish your goals and vision. I can create intuitive and aesthetically pleasing devices that are very easy to use.',
    },
  },

  goal: {
    title: 'Hit your goal',
    subtitle: (count: number, goal: number) => {
      if (count === 0) return 'Generate your first job application to get hired faster';
      if (count === goal - 1) return 'One more job application and you hit your goal';
      return 'Generate and send out couple more job applications to get hired faster';
    },
    reachedTitle: 'You hit your goal',
    reachedSubtitle:
      'Keep the momentum going: every application you send moves you closer to an offer',
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
