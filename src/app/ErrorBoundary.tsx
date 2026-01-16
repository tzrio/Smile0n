import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // Log for debugging (still shows a readable UI instead of blank screen)
    console.error('Unhandled UI error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/70">
            <div className="text-sm font-semibold text-gray-900">Aplikasi mengalami error</div>
            <div className="mt-2 text-sm text-gray-700">{this.state.error.message}</div>
            <div className="mt-4 text-xs text-gray-500">Coba refresh halaman. Jika masih terjadi, kirim screenshot error ini.</div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
