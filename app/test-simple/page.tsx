export default function TestPage() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333' }}>Test Page - If you see this, React works!</h1>
      <p style={{ color: '#666' }}>This is a simple test page without any dependencies.</p>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <p>If you see this page, the basic setup is working.</p>
        <p>Now check if TailwindCSS works:</p>
        <div className="bg-blue-500 text-white p-4 rounded-lg mt-4">
          This should be a blue box with white text if TailwindCSS works.
        </div>
      </div>
    </div>
  );
}

