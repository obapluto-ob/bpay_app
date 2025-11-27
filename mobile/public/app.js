// Simple mobile app loader
document.addEventListener('DOMContentLoaded', function() {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `
            <div style="
                min-height: 100vh;
                background: #1a365d;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                font-family: Arial, sans-serif;
            ">
                <div style="text-align: center; max-width: 400px; width: 100%;">
                    <div style="
                        width: 100px;
                        height: 100px;
                        background: #f59e0b;
                        border-radius: 50%;
                        margin: 0 auto 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    ">
                        <img src="./assets/images/5782897843587714011_120.jpg" 
                             style="width: 60px; height: 60px; border-radius: 50%;" 
                             alt="BPay Logo" />
                    </div>
                    <h1 style="color: white; font-size: 36px; margin-bottom: 8px;">BPay</h1>
                    <p style="color: #cbd5e1; font-size: 18px; margin-bottom: 8px;">Crypto to Cash Trading</p>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 40px;">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div style="
                                width: 24px; height: 16px; border-radius: 2px; overflow: hidden;
                                border: 1px solid rgba(255,255,255,0.3); display: flex;
                            ">
                                <div style="flex: 1; background: #008751;"></div>
                                <div style="flex: 1; background: #ffffff;"></div>
                                <div style="flex: 1; background: #008751;"></div>
                            </div>
                            <span style="color: #94a3b8; font-size: 12px;">Nigeria</span>
                        </div>
                        <span style="color: #94a3b8;">•</span>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div style="
                                width: 24px; height: 16px; border-radius: 2px; overflow: hidden;
                                border: 1px solid rgba(255,255,255,0.3); display: flex; flex-direction: column;
                            ">
                                <div style="flex: 1; background: #000000;"></div>
                                <div style="flex: 1; background: #ce1126;"></div>
                                <div style="flex: 0.5; background: #ffffff;"></div>
                                <div style="flex: 1; background: #ce1126;"></div>
                                <div style="flex: 1; background: #007a3d;"></div>
                            </div>
                            <span style="color: #94a3b8; font-size: 12px;">Kenya</span>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 16px; backdrop-filter: blur(10px);">
                        <h2 style="color: white; font-size: 24px; margin-bottom: 24px;">Welcome Back</h2>
                        
                        <input type="email" placeholder="Email" style="
                            width: 100%; padding: 16px; margin-bottom: 16px; border: none;
                            border-radius: 12px; font-size: 16px; box-sizing: border-box;
                        " id="email" />
                        
                        <div style="position: relative; margin-bottom: 16px;">
                            <input type="password" placeholder="Password" style="
                                width: 100%; padding: 16px; border: none;
                                border-radius: 12px; font-size: 16px; box-sizing: border-box;
                                padding-right: 50px;
                            " id="password" />
                            <button onclick="togglePassword()" style="
                                position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
                                background: none; border: none; color: #64748b; cursor: pointer;
                            " id="toggleBtn">👁</button>
                        </div>
                        
                        <button onclick="handleLogin()" style="
                            width: 100%; background: #f59e0b; color: white; border: none;
                            padding: 18px; border-radius: 12px; font-size: 18px; font-weight: bold;
                            cursor: pointer; margin-bottom: 16px;
                            box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
                        ">Login</button>
                        
                        <div style="text-align: center; margin: 20px 0;">
                            <span style="color: #94a3b8; font-size: 14px;">Or continue with</span>
                        </div>
                        
                        <div style="display: flex; gap: 12px;">
                            <button onclick="handleGoogleLogin()" style="
                                flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
                                background: rgba(255,255,255,0.1); border: none; padding: 12px;
                                border-radius: 8px; color: white; cursor: pointer;
                            ">
                                <div style="
                                    width: 20px; height: 20px; background: white; border-radius: 50%;
                                    display: flex; align-items: center; justify-content: center;
                                ">
                                    <span style="color: #4285f4; font-weight: bold; font-size: 12px;">G</span>
                                </div>
                                Google
                            </button>
                            <button onclick="handleAppleLogin()" style="
                                flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
                                background: rgba(255,255,255,0.1); border: none; padding: 12px;
                                border-radius: 8px; color: white; cursor: pointer;
                            ">
                                <div style="
                                    width: 20px; height: 20px; background: black; border-radius: 4px;
                                    display: flex; align-items: center; justify-content: center;
                                ">
                                    <span style="color: white; font-size: 14px;">🍎</span>
                                </div>
                                Apple
                            </button>
                        </div>
                        
                        <div style="text-align: center; margin-top: 20px;">
                            <a href="#" onclick="handleForgotPassword()" style="color: #cbd5e1; text-decoration: none;">Forgot Password?</a>
                        </div>
                        <div style="text-align: center; margin-top: 16px;">
                            <a href="#" onclick="handleSignup()" style="color: #cbd5e1; text-decoration: none;">Don't have an account? Sign up</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
});

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('toggleBtn');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁';
    }
}

function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Demo login
    if (email === 'demo@bpay.com' && password === 'demo123') {
        alert('Login successful! Welcome to BPay.');
        // Redirect to dashboard (would be implemented)
    } else {
        alert('Invalid credentials. Try: demo@bpay.com / demo123');
    }
}

function handleGoogleLogin() {
    alert('Google Sign In will be available soon. For now, please use email registration.');
}

function handleAppleLogin() {
    alert('Apple Sign In will be available soon. For now, please use email registration.');
}

function handleForgotPassword() {
    alert('Password reset functionality coming soon.');
}

function handleSignup() {
    alert('Registration page coming soon.');
}