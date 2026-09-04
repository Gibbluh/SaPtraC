const RateLimitedUI = () => {
  return (
    <div className="bg-red-100 text-red-700 p-4 rounded shadow text-center">
      <h2 className="text-2xl font-bold mb-2">Rate Limit Exceeded</h2>
      <p>You have made too many requests. Please wait a minute and try again.</p>
    </div>
  )
}

export default RateLimitedUI
