import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FiArrowLeft, FiMail, FiMapPin, FiPhone, FiSave } from "react-icons/fi"
import api from "../../services/api"

const EMPTY_CONTACT_INFO = { email: "", phone: "", location: "" }

function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [contactInfo, setContactInfo] = useState(EMPTY_CONTACT_INFO)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    let active = true

    Promise.all([
      api.get("/admin/messages"),
      api.get("/public/contact-info"),
    ])
      .then(async ([messageResponse, contactResponse]) => {
        if (!active) return
        const fetchedMessages = messageResponse.data?.messages || []
        setMessages(fetchedMessages)
        setContactInfo({
          ...EMPTY_CONTACT_INFO,
          ...contactResponse.data?.contactInfo,
        })
        if (fetchedMessages.some((message) => !message.readAt)) {
          await api.patch("/admin/messages/read-all")
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError.response?.data?.message || "Unable to load messages and contact details."
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const updateContactField = (event) => {
    const { name, value } = event.target
    setContactInfo((current) => ({ ...current, [name]: value }))
  }

  const saveContactInfo = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    setNotice("")

    try {
      const response = await api.patch("/admin/messages/contact-info", contactInfo)
      setContactInfo({ ...EMPTY_CONTACT_INFO, ...response.data?.contactInfo })
      setNotice("Contact details saved.")
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Unable to save contact details.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-500 hover:text-white">
          <FiArrowLeft size={14} /> Dashboard
        </Link>

        <header className="mt-7 border-b border-white/10 pb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">NAMIKOL ADMIN</p>
          <h1 className="mt-2 text-3xl font-semibold">Messages & Contact Details</h1>
        </header>

        {error && <p className="mt-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300" role="alert">{error}</p>}
        {notice && <p className="mt-5 text-sm text-emerald-400" role="status">{notice}</p>}

        <section className="mt-8 border-b border-white/10 pb-8">
          <h2 className="text-lg font-semibold">Public contact information</h2>
          <p className="mt-1 text-sm text-neutral-500">Shown on the customer Contact page.</p>
          <form onSubmit={saveContactInfo} className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="text-xs text-neutral-400">
              <span className="mb-2 flex items-center gap-2"><FiMail /> Email</span>
              <input required type="email" name="email" value={contactInfo.email} onChange={updateContactField} className="h-12 w-full rounded-lg border border-white/10 bg-[#101010] px-3 text-sm text-white outline-none focus:border-white/30" />
            </label>
            <label className="text-xs text-neutral-400">
              <span className="mb-2 flex items-center gap-2"><FiPhone /> Phone</span>
              <input required name="phone" value={contactInfo.phone} onChange={updateContactField} className="h-12 w-full rounded-lg border border-white/10 bg-[#101010] px-3 text-sm text-white outline-none focus:border-white/30" />
            </label>
            <label className="text-xs text-neutral-400">
              <span className="mb-2 flex items-center gap-2"><FiMapPin /> Location</span>
              <input required name="location" value={contactInfo.location} onChange={updateContactField} className="h-12 w-full rounded-lg border border-white/10 bg-[#101010] px-3 text-sm text-white outline-none focus:border-white/30" />
            </label>
            <div className="md:col-span-3">
              <button disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-xs font-semibold uppercase tracking-wide text-black disabled:opacity-50">
                <FiSave /> {saving ? "Saving..." : "Save contact details"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-semibold">Customer messages</h2>
              <p className="mt-1 text-sm text-neutral-500">Newest first, showing up to 200 messages.</p>
            </div>
            {!loading && <span className="text-xs text-neutral-500">{messages.length} messages</span>}
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-neutral-500">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-500">No customer messages yet.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {messages.map((message) => (
                <article key={message._id} className="grid gap-3 py-6 md:grid-cols-[220px_1fr]">
                  <div>
                    <p className="text-sm font-medium">{message.name}</p>
                    <a href={`mailto:${message.email}`} className="mt-1 block break-all text-xs text-neutral-400 hover:text-white">{message.email}</a>
                    <time className="mt-2 block text-[11px] text-neutral-600" dateTime={message.createdAt}>
                      {new Date(message.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{message.subject}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-400">{message.message}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default AdminMessages