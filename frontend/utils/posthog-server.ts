import { PostHog } from 'posthog-node'

export default function PostHogClient() {
  if (process.env.NODE_ENV === 'production') {
    return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0
    })
  } else {
    return new PostHog('dev', {
      enable: false
    })
  }
}
