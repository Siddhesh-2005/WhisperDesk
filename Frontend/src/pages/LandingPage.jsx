import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendEmail, reset } from '../store/slices/authSlice';

function LandingPage() {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const dispatch = useDispatch();
  const { isLoading, emailSent, isError, message } = useSelector((state) => state.auth);

  useEffect(() => {
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setLocalError('Please drop your email to get the magic link.');
      return;
    }

    setLocalError('');
    dispatch(sendEmail(trimmed));
  };

  const status = (() => {
    if (localError) return { tone: 'error', text: localError };
    if (isError && message) return { tone: 'error', text: message };
    if (emailSent) return { tone: 'success', text: 'Magic link is on its way. Check your inbox!' };
    return null;
  })();

  return (
    <div className="min-h-screen bg-[var(--sand)] text-[var(--ink)] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
        <div className="absolute -left-20 top-10 h-40 w-40 rounded-[32px] bg-[var(--accent)] border-4 border-black rotate-6 shadow-[12px_12px_0_#0f172a]" />
        <div className="absolute right-6 bottom-12 h-28 w-28 rounded-[24px] bg-[var(--accent-2)] border-4 border-black -rotate-6 shadow-[10px_10px_0_#0f172a]" />
        <div className="absolute left-1/3 top-1/3 h-16 w-48 bg-[var(--ink)]/10 rotate-2" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-[var(--ink)] text-[var(--sand)] border-4 border-black rounded-xl grid place-items-center shadow-[8px_8px_0_#0f172a] font-bold">WD</div>
            <div>
              <p className="text-sm font-semibold tracking-[0.12em] uppercase">WhisperDesk</p>
              <p className="text-base font-medium text-[var(--ink)]/70">Anonymous. Raw. Unfiltered.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="px-4 py-2 border-[3px] border-black rounded-lg bg-[var(--accent-2)] shadow-[6px_6px_0_#0f172a] text-sm font-semibold">100% Anonymous</span>
            <span className="px-4 py-2 border-[3px] border-black rounded-lg bg-white shadow-[6px_6px_0_#0f172a] text-sm font-semibold">College emails only</span>
          </div>
        </header>

        <main className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-[var(--accent)] border-4 border-black rounded-full shadow-[6px_6px_0_#0f172a] text-sm font-semibold">
              <span className="inline-flex h-3 w-3 rounded-full bg-black" />
              Your identity stays hidden. Always.
            </div>

            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
              Speak your mind freely. Stay completely anonymous.
            </h1>

            <p className="text-lg leading-relaxed max-w-2xl text-[var(--ink)]/80">
              A safe space for college students to share thoughts, confessions, and stories without revealing their identity. Use your college email to verify you're a student — your posts remain anonymous.
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              {[{
                title: 'Stay Anonymous',
                detail: 'Your identity is never revealed. Post freely without fear.',
                color: 'bg-white'
              }, {
                title: 'Students Only',
                detail: 'Verified college emails keep the community authentic.',
                color: 'bg-[var(--accent-2)]'
              }, {
                title: 'Share Freely',
                detail: 'Confessions, stories, advice — express yourself openly.',
                color: 'bg-[var(--accent)]'
              }].map((item) => (
                <div
                  key={item.title}
                  className={`${item.color} border-4 border-black rounded-2xl p-4 shadow-[8px_8px_0_#0f172a] min-h-[140px] flex flex-col gap-2`}
                >
                  <p className="text-sm uppercase tracking-[0.1em] font-semibold">{item.title}</p>
                  <p className="text-sm leading-relaxed text-[var(--ink)]/80">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-4 border-black rounded-3xl shadow-[14px_14px_0_#0f172a] p-8 relative overflow-hidden">
            <div className="absolute -top-12 -right-10 h-24 w-24 bg-[var(--accent-2)] border-4 border-black rounded-3xl rotate-12" aria-hidden />
            <div className="absolute -bottom-10 -left-8 h-24 w-24 bg-[var(--accent)] border-4 border-black rounded-3xl -rotate-6" aria-hidden />

            <div className="relative space-y-6">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-2xl bg-[var(--ink)] text-[var(--sand)] grid place-items-center border-4 border-black shadow-[6px_6px_0_#0f172a] font-bold">@</span>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] font-semibold text-[var(--ink)]/70">Get Started</p>
                  <p className="text-lg font-semibold">Enter your college email</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="flex flex-col gap-2 text-sm font-semibold">
                  College Email
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@college.edu"
                    className="w-full rounded-xl border-4 border-black px-4 py-3 bg-[var(--sand)] text-base font-medium shadow-[8px_8px_0_#0f172a] focus:outline-none focus:ring-4 focus:ring-[var(--accent-2)]"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl border-4 border-black bg-[var(--accent)] text-base font-bold uppercase tracking-[0.08em] shadow-[10px_10px_0_#0f172a] transition-transform duration-150 active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-70"
                >
                  {isLoading ? 'Sending…' : 'Send magic link'}
                </button>
              </form>

              {status ? (
                <div
                  className={`rounded-xl border-[3px] px-4 py-3 text-sm font-semibold shadow-[6px_6px_0_#0f172a] ${status.tone === 'error' ? 'bg-red-200 border-black text-[var(--ink)]' : 'bg-green-200 border-black text-[var(--ink)]'}`}
                  role="status"
                >
                  {status.text}
                </div>
              ) : null}

              <div className="flex items-center gap-3 text-sm font-medium text-[var(--ink)]/70">
                <span className="inline-flex h-8 w-8 rounded-full border-[3px] border-black bg-white shadow-[4px_4px_0_#0f172a] items-center justify-center font-black">🔒</span>
                Your email verifies you're a student. Your posts stay anonymous.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LandingPage;
