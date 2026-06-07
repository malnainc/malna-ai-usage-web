export async function notifyFailure(text: string) {
  const token = process.env.SLACK_BOT_TOKEN
  const channel = process.env.SLACK_REPORT_CHANNEL || 'UCYA37NTT'
  if (!token) {
    console.error('[notifyFailure]', text)
    return
  }
  try {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ channel, text }),
    })
  } catch (e) {
    console.error('[notifyFailure] slack post failed', e)
  }
}
