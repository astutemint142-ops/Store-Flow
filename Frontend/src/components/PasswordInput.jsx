import { useState } from 'react'

export default function PasswordInput({ value, onChange, placeholder, required, style }) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{ width: '100%', padding: 8, paddingRight: 36, boxSizing: 'border-box' }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: 4,
          top: '50%',
          transform: 'translateY(-50%)',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: 16,
          padding: 4,
          lineHeight: 1,
        }}
      >
        {visible ? '🙈' : '👁️'}
      </button>
    </div>
  )
}
