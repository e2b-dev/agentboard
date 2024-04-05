'use client'

import Script from 'next/script'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'chatlio-widget': any
    }
  }
}
export function Feedback() {
  return (
    <>
      <Script src="https://js.chatlio.com/widget.js" strategy="lazyOnload" />
      <chatlio-widget
        widgetid="9bbd4486-7292-46d9-7df8-1981d9e91a70"
        disable-favicon-badge
      ></chatlio-widget>
    </>
  )
}
