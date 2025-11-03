import { useState, useContext } from 'react'
import { AuthContext } from '../store/AuthContext'
import type { LoginFormValues } from '../interfaces/interfaces'

const Login = () => {
  const { signIn, loading } = useContext(AuthContext)
  const [formValues, setFormValues] = useState<LoginFormValues>({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    signIn(formValues)
    
  }

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formValues.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formValues.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </div>
  )
}

export default Login
