import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Noakhali Vision UI error:", error, info); }
  render() {
    if (this.state.error) return <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 py-16 text-center"><h1 className="text-2xl font-black">পেজটি দেখাতে সমস্যা হয়েছে</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted">একটি অপ্রত্যাশিত UI ত্রুটি হয়েছে। আপনার সংরক্ষিত তথ্য মুছে ফেলা হয়নি। পেজটি আবার লোড করে চেষ্টা করুন।</p><button onClick={() => window.location.reload()} className="mt-6 bg-primary px-5 py-3 text-sm font-black text-white">Reload Page</button>{import.meta.env.DEV && <pre className="mt-5 max-w-full overflow-auto rounded bg-gray-100 p-3 text-left text-xs">{String(this.state.error?.stack || this.state.error)}</pre>}</main>;
    return this.props.children;
  }
}
