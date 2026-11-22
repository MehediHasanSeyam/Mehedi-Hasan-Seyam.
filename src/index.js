import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// ব্যাকগ্রাউন্ডে ইন্টারঅ্যাক্টিভ নক্ষত্র ও কানেকশন লাইন (থিম অনুযায়ী রঙ পরিবর্তনশীল)
function ParticleNetwork({ isLight }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const mouse = { x: null, y: null, radius: 135 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const isMobile = window.innerWidth < 640;
    const particleCount = isMobile ? 22 : Math.min(50, Math.floor(window.innerWidth / 26));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      size: Math.random() * 1.8 + 1,
    }));

    const dotColor = isLight ? 'rgba(109, 40, 217, 0.4)' : 'rgba(192, 132, 252, 0.5)';
    const lineRgb = isLight ? '109, 40, 217' : '168, 85, 247';
    const mouseLineRgb = isLight ? '8, 145, 178' : '34, 211, 238';

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${lineRgb}, ${0.13 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.75;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${mouseLineRgb}, ${0.3 * (1 - dist / mouse.radius)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isLight]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}
    />
  );
}

// স্ক্রল করলে কার্ডগুলো নিচ থেকে ভেসে ওঠার কম্পোনেন্ট
function RevealBox({ children, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.06 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px) scale(1)' : 'translateY(24px) scale(0.98)',
        transition: `all 0.65s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// প্রো-লেভেল স্পটলাইট + থ্রি-ডি টিল্ট প্রজেক্ট কার্ড (টাচ ডিভাইসে স্মুথ)
function SpotlightProjectCard({ children, isLight }) {
  const [transformStyle, setTransformStyle] = useState(
    'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)'
  );
  const [spot, setSpot] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMove = (e) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -4;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 4;
    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`
    );
    setSpot({ x, y, opacity: 1 });
  };

  const handleLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)');
    setSpot((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      className="glass-card spotlight-card"
      style={{
        transform: transformStyle,
        transition: spot.opacity ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          opacity: spot.opacity,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(380px circle at ${spot.x}px ${spot.y}px, ${
            isLight ? 'rgba(126, 34, 206, 0.08)' : 'rgba(168, 85, 247, 0.14)'
          }, transparent 70%)`,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
}

// ম্যাগনেটিক হোভার বাটন
function MagneticLink({ href, className, children }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.22;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.22;
    setOffset({ x, y });
  };

  const handleLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <a
      href={href}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: offset.x === 0 ? 'transform 0.35s ease-out' : 'transform 0.08s ease-out',
      }}
    >
      {children}
    </a>
  );
}

// WhatsApp অফিসিয়াল SVG লোগো
function WhatsAppIcon({ color = '#25d366', size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67ZM8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z" />
    </svg>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('seyam-theme') || 'dark');
  const isLight = theme === 'light';

  const toggleTheme = () => {
    const next = isLight ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('seyam-theme', next);
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 300, y: 200 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [skillTab, setSkillTab] = useState('tech');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderMsg, setSenderMsg] = useState('');

  // লাইভ টাইপরাইটার অ্যানিমেশন
  const roles = [
    'CSE Student @ IUB',
    'Aspiring Software Engineer',
    'Frontend Web Developer',
    'Problem Solver & Tech Enthusiast',
  ];
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentRole = roles[roleIndex];
    const speed = isDeleting ? 40 : 85;
    const timer = setTimeout(() => {
      if (!isDeleting && displayedText.length < currentRole.length) {
        setDisplayedText(currentRole.slice(0, displayedText.length + 1));
      } else if (isDeleting && displayedText.length > 0) {
        setDisplayedText(currentRole.slice(0, displayedText.length - 1));
      } else if (!isDeleting && displayedText.length === currentRole.length) {
        setTimeout(() => setIsDeleting(true), 1400);
      } else if (isDeleting && displayedText.length === 0) {
        setIsDeleting(false);
        setRoleIndex((prev) => (prev + 1) % roles.length);
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, roleIndex]);

  // মাউস ট্র্যাকিং, স্ক্রল প্রোগ্রেস ও অ্যাক্টিভ সেকশন ডিটেকশন
  useEffect(() => {
    const sectionIds = [
      'hero',
      'section-objective',
      'section-experience',
      'section-education',
      'section-skills',
      'section-projects',
      'section-contact',
    ];

    const onMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    const onScroll = () => {
      const total = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(height > 0 ? (total / height) * 100 : 0);
      setShowBackToTop(window.scrollY > 300);

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.getBoundingClientRect().top <= 180) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((p) => !p);
      } else if (e.key === 'Escape') {
        setCmdOpen(false);
        setLightboxImg(null);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const projects = [
    {
      num: '01',
      title: 'Mehedi Hasan Seyam Profile Portfolio',
      subtitle: 'Personal Web Development Project',
      link: 'https://mehedihasanseyam.github.io/Mehedi-Hasan-Seyam/',
      description:
        'A clean, modern personal portfolio website showcasing academic credentials, core technical skills, and software development projects with an intuitive user interface.',
      tech: ['HTML5', 'CSS3', 'Tailwind CSS', 'JavaScript'],
    },
    {
      num: '02',
      title: 'Cash Memo - My Shop',
      subtitle: 'Web Utility & Billing App',
      link: 'https://mehedihasanseyam.github.io/Cash-Memo---My-Shop/',
      description:
        'A digital cash memo invoice generation tool built for retail shops to simplify itemized pricing, total billing calculations, and printable invoice layout creation.',
      tech: ['HTML5', 'CSS3', 'JavaScript'],
    },
    {
      num: '03',
      title: 'Faculty Academic Profile Website',
      subtitle: 'Web Development Project',
      link: 'https://muhammadmustafizurrahman.netlify.app',
      description:
        'Designed and developed a modern academic portfolio website for Muhammad Mustafizur Rahman, Adjunct Faculty at IUB (SLASS). Features an engaging user interface, integrated contact system, and a lightbox image gallery.',
      tech: ['HTML5', 'CSS3', 'Tailwind CSS', 'JavaScript'],
    },
    {
      num: '04',
      title: "Men's Zone Fashion",
      subtitle: 'E-Commerce Frontend Project',
      link: 'https://mehedihasanseyam.github.io/MENS-ZONE-FASHION/',
      description:
        "An e-commerce clothing storefront layout built to feature modern men's fashion apparel with interactive product displays and responsive layout design.",
      tech: ['HTML5', 'CSS3', 'Responsive Design'],
    },
    {
      num: '05',
      title: 'Jonaki Service Website',
      subtitle: 'Web Development Project',
      link: 'https://jonakiservice.vercel.app/',
      description:
        'I designed and built this simple service website for "Jonaki Service" using HTML and CSS to practice frontend layouts and basic web design concepts.',
      tech: ['HTML5', 'CSS3', 'Responsive Design'],
    },
  ];

  const filterCategories = ['All', 'JavaScript', 'Tailwind CSS', 'Responsive Design'];
  const filteredProjects =
    selectedFilter === 'All' ? projects : projects.filter((p) => p.tech.includes(selectedFilter));

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('mhs2700823@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleQuickWhatsApp = (e) => {
    e.preventDefault();
    const text = `Hello Seyam! I'm ${senderName || 'a visitor'}. ${senderMsg || 'I visited your portfolio and would like to connect.'}`;
    window.open(`https://wa.me/8801759333003?text=${encodeURIComponent(text)}`, '_blank');
  };

  const commandActions = [
    { label: `Switch to ${isLight ? 'Dark' : 'Light'} Mode`, action: toggleTheme },
    { label: '01. Career Objective', action: () => (window.location.hash = 'section-objective') },
    { label: '02. Experience', action: () => (window.location.hash = 'section-experience') },
    { label: '03. Academic Timeline', action: () => (window.location.hash = 'section-education') },
    { label: '04. Skills & Languages', action: () => (window.location.hash = 'section-skills') },
    { label: '05. Projects & Work', action: () => (window.location.hash = 'section-projects') },
    { label: 'Copy Email (mhs2700823@gmail.com)', action: handleCopyEmail },
    { label: 'Message on WhatsApp', action: () => window.open('https://wa.me/8801759333003', '_blank') },
  ].filter((c) => c.label.toLowerCase().includes(cmdQuery.toLowerCase()));

  const navDots = [
    { id: 'hero', label: 'Top' },
    { id: 'section-objective', label: 'Objective' },
    { id: 'section-experience', label: 'Experience' },
    { id: 'section-education', label: 'Academic' },
    { id: 'section-skills', label: 'Skills' },
    { id: 'section-projects', label: 'Projects' },
    { id: 'section-contact', label: 'Contact' },
  ];

  return (
    <div className={`portfolio-root ${isLight ? 'light-mode' : 'dark-mode'}`}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          overflow-x: hidden;
          -webkit-tap-highlight-color: transparent;
        }

        .dark-mode {
          --bg-main: #040710;
          --text-main: #f8fafc;
          --text-body: #cbd5e1;
          --text-muted: #94a3b8;
          --nav-bg: rgba(4, 7, 16, 0.85);
          --card-bg: rgba(15, 23, 42, 0.48);
          --card-border: rgba(255, 255, 255, 0.09);
          --card-shadow: 0 16px 36px rgba(0, 0, 0, 0.48);
          --pill-bg: rgba(168, 85, 247, 0.14);
          --pill-text: #d8b4fe;
          --input-bg: rgba(8, 12, 26, 0.9);
          --grid-line: rgba(168, 85, 247, 0.05);
          --hero-grad: linear-gradient(90deg, #ffffff, #d8b4fe, #67e8f9, #ffffff);
          --accent-grad: linear-gradient(90deg, #c084fc, #22d3ee);
          --chip-bg: rgba(11, 16, 33, 0.94);
          --cmd-bg: #0b1021;
          --code-bg: rgba(8, 12, 26, 0.82);
        }

        .light-mode {
          --bg-main: #f8fafc;
          --text-main: #0f172a;
          --text-body: #334155;
          --text-muted: #64748b;
          --nav-bg: rgba(248, 250, 252, 0.88);
          --card-bg: rgba(255, 255, 255, 0.9);
          --card-border: rgba(148, 163, 184, 0.28);
          --card-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
          --pill-bg: rgba(126, 34, 206, 0.09);
          --pill-text: #6b21a8;
          --input-bg: #ffffff;
          --grid-line: rgba(126, 34, 206, 0.05);
          --hero-grad: linear-gradient(90deg, #0f172a, #7e22ce, #0891b2, #0f172a);
          --accent-grad: linear-gradient(90deg, #7e22ce, #0891b2);
          --chip-bg: rgba(255, 255, 255, 0.96);
          --cmd-bg: #ffffff;
          --code-bg: rgba(255, 255, 255, 0.94);
        }

        .portfolio-root {
          min-height: 100vh;
          padding-bottom: 64px;
          position: relative;
          background-color: var(--bg-main);
          color: var(--text-main);
          transition: background-color 0.35s ease, color 0.35s ease;
        }
        .bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
          background-size: 46px 46px;
          pointer-events: none;
          z-index: 0;
        }
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
          animation: orbPulse 8s ease-in-out infinite alternate;
        }
        .orb-1 { top: -80px; left: -80px; width: 380px; height: 380px; background: rgba(147, 51, 234, 0.2); }
        .orb-2 { top: 38%; right: -100px; width: 380px; height: 380px; background: rgba(6, 182, 212, 0.16); animation-delay: 2s; }
        .orb-3 { bottom: 5%; left: 22%; width: 350px; height: 350px; background: rgba(217, 70, 239, 0.12); animation-delay: 4s; }

        @keyframes orbPulse {
          0% { transform: scale(1) translate(0, 0); opacity: 0.65; }
          100% { transform: scale(1.2) translate(25px, -20px); opacity: 1; }
        }
        @keyframes floatAvatar {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes gradientText {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pingDot {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes glowSpin {
          0% { filter: hue-rotate(0deg) blur(15px); }
          100% { filter: hue-rotate(360deg) blur(15px); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .scroll-bar-track {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 3px;
          z-index: 100;
        }
        .scroll-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #9333ea, #ec4899, #06b6d4);
          box-shadow: 0 0 12px rgba(147, 51, 234, 0.8);
          transition: width 0.12s ease-out;
        }

        .side-dots {
          position: fixed;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 45;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        @media (max-width: 1080px) {
          .side-dots { display: none; }
        }
        .side-dot-link {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--card-border);
          border: 1px solid rgba(147, 51, 234, 0.4);
          transition: all 0.3s ease;
          position: relative;
        }
        .side-dot-link.active {
          height: 26px;
          background: linear-gradient(180deg, #9333ea, #06b6d4);
          border-color: transparent;
          box-shadow: 0 0 10px rgba(147, 51, 234, 0.7);
        }

        .navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--nav-bg);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--card-border);
          transition: background 0.35s ease;
        }
        .nav-inner {
          max-width: 920px;
          margin: 0 auto;
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: 1.4px;
          color: var(--text-main);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .brand-dot {
          width: 9px; height: 9px;
          border-radius: 50%;
          background: linear-gradient(135deg, #9333ea, #06b6d4);
          box-shadow: 0 0 12px #9333ea;
        }
        .nav-actions { display: flex; align-items: center; gap: 8px; }
        .btn-jump {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          color: var(--text-body);
          padding: 7px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s;
        }
        .btn-jump:hover { background: rgba(168, 85, 247, 0.18); border-color: #9333ea; color: var(--text-main); }
        .kbd-badge {
          background: var(--bg-main);
          border: 1px solid var(--card-border);
          padding: 2px 6px;
          border-radius: 5px;
          font-size: 10px;
          color: #9333ea;
        }
        .btn-theme {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          color: var(--text-main);
          padding: 7px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.25s;
        }
        .btn-theme:hover {
          border-color: #9333ea;
          background: rgba(168, 85, 247, 0.18);
          transform: translateY(-1px);
        }
        .btn-menu {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          color: var(--text-main);
          padding: 7px 11px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.25s;
        }
        .btn-menu:hover { background: rgba(168, 85, 247, 0.2); border-color: #9333ea; }

        .dropdown-nav {
          max-width: 920px;
          margin: 0 auto;
          padding: 12px 20px 16px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 8px;
          border-top: 1px solid var(--card-border);
        }
        .dropdown-link {
          text-decoration: none;
          color: var(--text-body);
          font-size: 12.5px;
          font-weight: 500;
          padding: 10px 12px;
          border-radius: 10px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          transition: all 0.25s;
        }
        .dropdown-link:hover {
          border-color: #9333ea;
          background: rgba(168, 85, 247, 0.16);
          color: var(--text-main);
          transform: translateX(4px);
        }

        .container {
          position: relative;
          z-index: 10;
          max-width: 920px;
          margin: 0 auto;
          padding: 40px 20px 0;
        }

        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 36px;
          flex-wrap: wrap-reverse;
          margin-bottom: 36px;
        }
        .hero-text { flex: 1; min-width: 280px; }
        .typewriter-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          background: var(--pill-bg);
          border: 1px solid rgba(168, 85, 247, 0.35);
          font-family: monospace;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--pill-text);
          margin-bottom: 14px;
          max-width: 100%;
        }
        .ping-wrapper { position: relative; width: 8px; height: 8px; flex-shrink: 0; }
        .ping-ring {
          position: absolute; inset: 0; border-radius: 50%;
          background: #34d399; animation: pingDot 1.5s infinite;
        }
        .ping-core { position: relative; width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
        .cursor-blink { color: #0891b2; animation: blinkCursor 0.8s infinite; font-weight: bold; }

        .hero-title {
          font-size: clamp(28px, 5vw, 46px);
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 14px;
          background: var(--hero-grad);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientText 5s linear infinite;
        }
        .hero-desc {
          font-size: 14px;
          line-height: 1.75;
          color: var(--text-body);
          margin-bottom: 22px;
        }
        .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn-primary {
          display: inline-block;
          text-align: center;
          text-decoration: none;
          padding: 12px 22px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #9333ea, #0891b2);
          box-shadow: 0 8px 25px rgba(147, 51, 234, 0.3);
        }
        .btn-secondary {
          display: inline-block;
          text-align: center;
          text-decoration: none;
          padding: 12px 22px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
          background: var(--card-bg);
          border: 1px solid var(--card-border);
        }

        .avatar-wrapper {
          position: relative;
          animation: floatAvatar 4.5s ease-in-out infinite;
          cursor: pointer;
          margin: 0 auto;
        }
        .avatar-glow {
          position: absolute;
          inset: -6px;
          border-radius: 22px;
          background: linear-gradient(135deg, #9333ea, #ec4899, #06b6d4);
          opacity: 0.6;
          animation: glowSpin 6s linear infinite;
        }
        .avatar-box {
          position: relative;
          width: 220px;
          height: 285px;
          border-radius: 18px;
          background: var(--chip-bg);
          border: 1px solid var(--card-border);
          padding: 6px;
          overflow: hidden;
          transition: transform 0.35s;
        }
        .avatar-wrapper:hover .avatar-box { transform: scale(1.03); }
        .avatar-box img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 12px;
        }
        .floating-chip {
          position: absolute;
          padding: 6px 11px;
          border-radius: 11px;
          background: var(--chip-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--card-border);
          font-size: 11px;
          font-weight: 700;
          box-shadow: var(--card-shadow);
          animation: floatBadge 3.5s ease-in-out infinite;
          z-index: 5;
          white-space: nowrap;
        }
        .chip-top { top: -10px; right: -12px; border-color: rgba(147, 51, 234, 0.45); color: #9333ea; }
        .chip-bottom { bottom: -10px; left: -12px; border-color: rgba(8, 145, 178, 0.45); color: #0891b2; animation-delay: 1.5s; }

        .dev-showcase {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
          gap: 16px;
          margin-bottom: 42px;
        }
        .code-window {
          background: var(--code-bg);
          backdrop-filter: blur(14px);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: var(--card-shadow);
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 12.5px;
        }
        .code-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(148, 163, 184, 0.08);
          border-bottom: 1px solid var(--card-border);
        }
        .win-dots { display: flex; gap: 6px; }
        .win-dot { width: 10px; height: 10px; border-radius: 50%; }
        .code-body { padding: 14px 16px; line-height: 1.65; color: var(--text-body); overflow-x: auto; }
        .c-kw { color: #c084fc; font-weight: 600; }
        .c-var { color: #38bdf8; }
        .c-str { color: #10b981; }
        .c-key { color: #f472b6; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .stat-box {
          background: var(--card-bg);
          backdrop-filter: blur(14px);
          border: 1px solid var(--card-border);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: var(--card-shadow);
          transition: transform 0.25s, border-color 0.25s;
        }
        .stat-box:hover { transform: translateY(-3px); border-color: rgba(147, 51, 234, 0.45); }
        .stat-num {
          font-size: 22px;
          font-weight: 800;
          background: var(--accent-grad);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .stat-lbl { font-size: 11.5px; color: var(--text-muted); font-weight: 600; margin-top: 2px; }

        .sec-block {
          border-top: 1px solid var(--card-border);
          padding-top: 34px;
          margin-bottom: 40px;
        }
        .sec-label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          background: var(--accent-grad);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 16px;
        }
        .glass-card {
          position: relative;
          overflow: hidden;
          background: var(--card-bg);
          backdrop-filter: blur(14px);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--card-shadow);
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.35s ease;
        }
        .glass-card:hover {
          border-color: rgba(147, 51, 234, 0.5);
          transform: translateY(-4px);
        }
        .card-text { font-size: 14px; line-height: 1.75; color: var(--text-body); }

        .timeline-wrap {
          position: relative;
          padding-left: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .timeline-wrap::before {
          content: '';
          position: absolute;
          left: 6px;
          top: 12px;
          bottom: 12px;
          width: 2px;
          background: linear-gradient(180deg, #9333ea, #06b6d4, rgba(6, 182, 212, 0.1));
          border-radius: 2px;
        }
        .timeline-item { position: relative; }
        .timeline-dot {
          position: absolute;
          left: -23px;
          top: 22px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--bg-main);
          border: 2.5px solid #9333ea;
          box-shadow: 0 0 10px rgba(147, 51, 234, 0.6);
        }
        .edu-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
        .edu-title { font-size: 16px; font-weight: 700; color: var(--text-main); line-height: 1.35; }
        .badge-gpa {
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 11px;
          border-radius: 999px;
          background: var(--pill-bg);
          border: 1px solid rgba(147, 51, 234, 0.35);
          color: var(--pill-text);
        }
        .edu-line { font-size: 13px; color: var(--text-body); margin-top: 4px; line-height: 1.55; }
        .edu-muted { color: var(--text-muted); font-weight: 500; }

        .tab-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
        .tab-btn {
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          color: var(--text-muted);
          transition: all 0.25s;
        }
        .tab-btn.active, .tab-btn:hover {
          background: rgba(147, 51, 234, 0.18);
          border-color: #9333ea;
          color: var(--text-main);
        }
        .skill-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 12px;
          animation: fadeSlideIn 0.4s ease;
        }
        .skill-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .skill-name { font-size: 14px; font-weight: 700; color: var(--text-main); }
        .skill-sub { font-size: 11px; color: var(--text-muted); }
        .skill-pct { font-size: 12px; font-family: monospace; color: #0891b2; font-weight: 700; }
        .bar-bg { width: 100%; height: 6px; background: rgba(148, 163, 184, 0.22); border-radius: 999px; overflow: hidden; }
        .bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #9333ea, #06b6d4);
        }

        .proj-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
        .filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
        .filter-btn {
          padding: 6px 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          color: var(--text-muted);
          transition: all 0.25s;
        }
        .filter-btn.active, .filter-btn:hover {
          background: linear-gradient(135deg, #9333ea, #0891b2);
          color: #fff;
          border-color: transparent;
        }
        .proj-stack { display: flex; flex-direction: column; gap: 16px; }
        .proj-chrome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--card-border);
        }
        .proj-num {
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
        }
        .proj-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
        .proj-sub { font-size: 12px; color: #0891b2; font-weight: 600; margin-top: 2px; }
        .btn-demo {
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-main);
          padding: 7px 14px;
          border-radius: 10px;
          background: var(--pill-bg);
          border: 1px solid rgba(147, 51, 234, 0.4);
          transition: all 0.25s;
          white-space: nowrap;
        }
        .btn-demo:hover { background: linear-gradient(135deg, #9333ea, #0891b2); color: #fff; }
        .tech-row { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--card-border); }
        .tech-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(8, 145, 178, 0.12);
          border: 1px solid rgba(8, 145, 178, 0.3);
          color: #0891b2;
        }

        .contact-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--card-border); margin-bottom: 16px; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 10px 0 12px; }
        .input-box {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          background: var(--input-bg);
          border: 1px solid var(--card-border);
          color: var(--text-main);
          font-size: 13.5px;
          outline: none;
        }
        .input-box:focus { border-color: #9333ea; }
        .btn-wa {
          padding: 11px 18px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #059669, #0d9488);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-wa:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(5, 150, 105, 0.35); }
        .social-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--card-border); }
        .social-btn {
          text-decoration: none;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-body);
          padding: 10px 14px;
          border-radius: 11px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s ease;
        }
        .social-btn svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }
        .social-btn:hover {
          transform: translateY(-3px);
          color: var(--text-main);
        }
        .social-btn:hover svg { transform: scale(1.15); }
        .social-mail:hover { border-color: #ea4335; background: rgba(234, 67, 53, 0.14); }
        .social-wa:hover { border-color: #25d366; background: rgba(37, 211, 102, 0.14); }
        .social-li:hover { border-color: #0a66c2; background: rgba(10, 102, 194, 0.15); }
        .social-fb:hover { border-color: #1877f2; background: rgba(24, 119, 242, 0.15); }
        .social-ig:hover { border-color: #e4405f; background: rgba(228, 64, 95, 0.14); }

        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px); z-index: 200;
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .cmd-box {
          width: 100%; max-width: 440px;
          background: var(--cmd-bg); border: 1px solid rgba(147, 51, 234, 0.45);
          border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.4);
        }
        .cmd-item {
          width: 100%; text-align: left; background: transparent; border: none;
          color: var(--text-main); padding: 12px 14px; border-radius: 10px; font-size: 13px;
          cursor: pointer; display: flex; justify-content: space-between;
        }
        .cmd-item:hover { background: rgba(147, 51, 234, 0.18); }
        .back-top {
          position: fixed; bottom: 20px; right: 20px; z-index: 90;
          width: 42px; height: 42px; border-radius: 50%; border: none;
          background: linear-gradient(135deg, #9333ea, #06b6d4);
          color: #fff; font-size: 18px; cursor: pointer;
          box-shadow: 0 8px 25px rgba(147, 51, 234, 0.4);
          transition: all 0.3s;
        }
        .back-top:hover { transform: translateY(-4px) scale(1.08); }

        /* =========================================
           মোবাইল ভিউ স্পেশাল রেসপন্সিভ অপ্টিমাইজেশন
           ========================================= */
        @media (max-width: 640px) {
          .nav-inner { padding: 12px 16px; }
          .brand { font-size: 17px; }
          .btn-jump { display: none; }
          .btn-theme { padding: 6px 10px; font-size: 11.5px; }
          .btn-menu { padding: 6px 10px; font-size: 15px; }
          .dropdown-nav {
            padding: 12px 16px 16px;
            grid-template-columns: repeat(2, 1fr);
          }

          .container { padding: 26px 16px 0; }

          .hero {
            flex-direction: column-reverse;
            text-align: center;
            gap: 24px;
            margin-bottom: 28px;
          }
          .hero-text { min-width: 100%; }
          .typewriter-pill {
            font-size: 11.5px;
            padding: 5px 12px;
            margin: 0 auto 12px;
          }
          .hero-title {
            font-size: 27px;
            margin-bottom: 10px;
          }
          .hero-desc {
            font-size: 13.5px;
            line-height: 1.65;
            margin-bottom: 20px;
          }
          .hero-btns {
            flex-direction: column;
            width: 100%;
            gap: 10px;
          }
          .btn-primary, .btn-secondary {
            width: 100%;
            padding: 12px 16px;
            font-size: 13.5px;
          }

          .avatar-box {
            width: 185px;
            height: 240px;
          }
          .floating-chip {
            font-size: 10px;
            padding: 5px 9px;
          }
          .chip-top { top: -8px; right: -8px; }
          .chip-bottom { bottom: -8px; left: -8px; }

          .dev-showcase {
            grid-template-columns: 1fr;
            gap: 14px;
            margin-bottom: 34px;
          }
          .code-window { font-size: 11.5px; }
          .code-body { padding: 12px; }
          .stats-grid { gap: 10px; }
          .stat-box { padding: 13px 12px; }
          .stat-num { font-size: 20px; }
          .stat-lbl { font-size: 11px; }

          .sec-block {
            padding-top: 28px;
            margin-bottom: 32px;
          }
          .glass-card {
            padding: 16px;
            border-radius: 14px;
          }
          .card-text { font-size: 13.5px; line-height: 1.68; }

          .timeline-wrap { padding-left: 18px; gap: 14px; }
          .timeline-wrap::before { left: 4px; }
          .timeline-dot { left: -19px; top: 20px; width: 10px; height: 10px; }
          .edu-title { font-size: 15px; }
          .edu-line { font-size: 12.5px; }

          .tab-bar { gap: 6px; }
          .tab-btn {
            flex: 1 1 auto;
            text-align: center;
            padding: 8px 10px;
            font-size: 11.5px;
          }
          .skill-grid { grid-template-columns: 1fr; gap: 10px; }

          .proj-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          .filter-group { width: 100%; }
          .filter-btn { font-size: 11.5px; padding: 5px 11px; }
          .proj-top { flex-direction: column; gap: 10px; }
          .btn-demo { width: 100%; text-align: center; padding: 9px 14px; }

          .contact-top { flex-direction: column; align-items: flex-start; }
          .contact-top .btn-jump { display: flex; width: 100%; justify-content: center; }
          .form-grid { grid-template-columns: 1fr; }
          .btn-wa { width: 100%; padding: 12px; }

          .social-row {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .social-btn {
            width: 100%;
            padding: 10px 10px;
            font-size: 12px;
          }
        }
      `}</style>

      {/* টপ স্ক্রল প্রোগ্রেস বার */}
      <div className="scroll-bar-track">
        <div className="scroll-bar-fill" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* ডেস্কটপ ফ্লোটিং সেকশন ডট নেভিগেশন */}
      <aside className="side-dots" aria-label="Section Navigator">
        {navDots.map((dot) => (
          <a
            key={dot.id}
            href={`#${dot.id}`}
            title={dot.label}
            className={`side-dot-link ${activeSection === dot.id ? 'active' : ''}`}
          />
        ))}
      </aside>

      <ParticleNetwork isLight={isLight} />
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
          background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, ${
            isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(168, 85, 247, 0.15)'
          }, transparent 70%)`,
        }}
      />

      <header className="navbar">
        <div className="nav-inner">
          <a href="#hero" className="brand">
            <span className="brand-dot" />
            SEYAM<span style={{ color: '#0891b2' }}>.</span>
          </a>

          <div className="nav-actions">
            <button
              className="btn-theme"
              onClick={toggleTheme}
              title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
            >
              <span>{isLight ? '🌙' : '☀️'}</span>
              <span>{isLight ? 'Dark' : 'Light'}</span>
            </button>

            <button className="btn-jump" onClick={() => setCmdOpen(true)}>
              <span>Quick Jump</span>
              <span className="kbd-badge">Ctrl K</span>
            </button>

            <button className="btn-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="dropdown-nav">
            {[
              { id: 'section-objective', label: '01. Objective' },
              { id: 'section-experience', label: '02. Experience' },
              { id: 'section-education', label: '03. Academic' },
              { id: 'section-skills', label: '04. Skills' },
              { id: 'section-projects', label: '05. Projects' },
              { id: 'section-contact', label: '06. Contact' },
            ].map((item) => (
              <a key={item.id} href={`#${item.id}`} className="dropdown-link" onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main className="container">
        {/* হিরো সেকশন */}
        <section id="hero" className="hero">
          <div className="hero-text">
            <div className="typewriter-pill">
              <div className="ping-wrapper">
                <div className="ping-ring" />
                <div className="ping-core" />
              </div>
              <span>{displayedText}</span>
              <span className="cursor-blink">|</span>
            </div>

            <h1 className="hero-title">MEHEDI HASAN SEYAM</h1>
            <p className="hero-desc">
              I am Mehedi Hasan Seyam — a Computer Science and Engineering student passionate about programming, web development, and building practical projects. I am an aspiring Software Engineer, continuously learning and developing my technical skills.
            </p>

            <div className="hero-btns">
              <MagneticLink href="#section-projects" className="btn-primary">
                Explore My Work
              </MagneticLink>
              <MagneticLink href="#section-contact" className="btn-secondary">
                Send Direct Message
              </MagneticLink>
            </div>
          </div>

          <div className="avatar-wrapper" onClick={() => setLightboxImg('profile.jpeg')}>
            <div className="floating-chip chip-top">B.Sc. in CSE @ IUB</div>
            <div className="floating-chip chip-bottom">5+ Web Projects</div>
            <div className="avatar-glow" />
            <div className="avatar-box">
              <img
                src="profile.jpeg"
                alt="Mehedi Hasan Seyam"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x400/0b1021/c084fc?text=Mehedi+Hasan+Seyam';
                }}
              />
            </div>
          </div>
        </section>

        {/* ডেভেলপার কোড উইজেট ও কুইক স্ট্যাটস */}
        <RevealBox>
          <div className="dev-showcase">
            <div className="code-window">
              <div className="code-bar">
                <div className="win-dots">
                  <span className="win-dot" style={{ background: '#ef4444' }} />
                  <span className="win-dot" style={{ background: '#f59e0b' }} />
                  <span className="win-dot" style={{ background: '#10b981' }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>developer.config.js</span>
              </div>
              <div className="code-body">
                <div><span className="c-kw">const</span> <span className="c-var">developer</span> = {'{'}</div>
                <div style={{ paddingLeft: '14px' }}><span className="c-key">name</span>: <span className="c-str">"Mehedi Hasan Seyam"</span>,</div>
                <div style={{ paddingLeft: '14px' }}><span className="c-key">university</span>: <span className="c-str">"IUB (Dept. of CSE)"</span>,</div>
                <div style={{ paddingLeft: '14px' }}><span className="c-key">focus</span>: [<span className="c-str">"Frontend"</span>, <span className="c-str">"Python"</span>, <span className="c-str">"UI/UX"</span>],</div>
                <div style={{ paddingLeft: '14px' }}><span className="c-key">availableForHire</span>: <span className="c-kw">true</span></div>
                <div>{'}'};</div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-num">05+</span>
                <span className="stat-lbl">Live Web Projects</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">3.12</span>
                <span className="stat-lbl">B.Sc. CSE CGPA</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">06+</span>
                <span className="stat-lbl">Core Tech & Tools</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">100%</span>
                <span className="stat-lbl">Responsive Design</span>
              </div>
            </div>
          </div>
        </RevealBox>

        {/* 01. Career Objective */}
        <section id="section-objective" className="sec-block">
          <RevealBox>
            <div className="sec-label">01. Career Objective</div>
            <div className="glass-card">
              <p className="card-text">
                A motivated and dedicated Computer Science and Engineering student seeking an opportunity to apply my academic knowledge, technical skills, and problem-solving abilities in a professional environment. I am eager to contribute to the success of an organization while continuously learning, developing new skills, and growing both personally and professionally.
              </p>
            </div>
          </RevealBox>
        </section>

        {/* 02. Experience */}
        <section id="section-experience" className="sec-block">
          <RevealBox>
            <div className="sec-label">02. Experience</div>
            <div className="glass-card">
              <p className="card-text">
                Currently, I do not have any formal professional work experience. However, I have gained practical knowledge and hands-on experience through academic projects, coursework, and self-learning. I am eager to apply my skills and continuously develop my professional abilities in a real-world work environment.
              </p>
            </div>
          </RevealBox>
        </section>

        {/* 03. Academic Qualifications */}
        <section id="section-education" className="sec-block">
          <RevealBox>
            <div className="sec-label">03. Academic Qualifications</div>
          </RevealBox>
          <div className="timeline-wrap">
            <RevealBox delay={60}>
              <div className="timeline-item">
                <div className="timeline-dot" />
                <div className="glass-card">
                  <div className="edu-head">
                    <h3 className="edu-title">Bachelor of Science (B.Sc.) in CSE</h3>
                    <span className="badge-gpa">CGPA: 3.12 (Out of 4.00)</span>
                  </div>
                  <p className="edu-line"><span className="edu-muted">University:</span> Independent University, Bangladesh (IUB)</p>
                  <p className="edu-line"><span className="edu-muted">Institute:</span> School of Engineering, Technology and Sciences (SETS)</p>
                  <p className="edu-line"><span className="edu-muted">Subject:</span> Computer Science and Engineering (CSE)</p>
                  <p className="edu-line"><span className="edu-muted">Year:</span> 2025 - Present</p>
                </div>
              </div>
            </RevealBox>

            <RevealBox delay={120}>
              <div className="timeline-item">
                <div className="timeline-dot" style={{ borderColor: '#0891b2', boxShadow: '0 0 10px rgba(8, 145, 178, 0.6)' }} />
                <div className="glass-card">
                  <div className="edu-head">
                    <h3 className="edu-title">Higher Secondary Certificate (H.S.C)</h3>
                    <span className="badge-gpa">GPA: 4.62 (Out of 5.00)</span>
                  </div>
                  <p className="edu-line"><span className="edu-muted">Board:</span> Cumilla Board</p>
                  <p className="edu-line"><span className="edu-muted">Institute:</span> Principal Kazi Faruky College</p>
                  <p className="edu-line"><span className="edu-muted">Group:</span> Science • <span className="edu-muted">Year:</span> 2024</p>
                </div>
              </div>
            </RevealBox>

            <RevealBox delay={180}>
              <div className="timeline-item">
                <div className="timeline-dot" style={{ borderColor: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)' }} />
                <div className="glass-card">
                  <div className="edu-head">
                    <h3 className="edu-title">Secondary School Certificate (S.S.C)</h3>
                    <span className="badge-gpa">GPA: 4.89 (Out of 5.00)</span>
                  </div>
                  <p className="edu-line"><span className="edu-muted">Board:</span> Cumilla Board</p>
                  <p className="edu-line"><span className="edu-muted">Institute:</span> Principal Kazi Faruky School</p>
                  <p className="edu-line"><span className="edu-muted">Group:</span> Science • <span className="edu-muted">Year:</span> 2022</p>
                </div>
              </div>
            </RevealBox>
          </div>
        </section>

        {/* 04. Skills & Languages */}
        <section id="section-skills" className="sec-block">
          <RevealBox>
            <div className="sec-label">04. Skills & Languages</div>
            <div className="tab-bar">
              <button className={`tab-btn ${skillTab === 'tech' ? 'active' : ''}`} onClick={() => setSkillTab('tech')}>
                Programming & Web
              </button>
              <button className={`tab-btn ${skillTab === 'tools' ? 'active' : ''}`} onClick={() => setSkillTab('tools')}>
                Productivity Tools
              </button>
              <button className={`tab-btn ${skillTab === 'soft' ? 'active' : ''}`} onClick={() => setSkillTab('soft')}>
                Soft & Language Skills
              </button>
            </div>
          </RevealBox>

          {skillTab === 'tech' && (
            <div className="skill-grid">
              {[
                { name: 'Python', sub: 'Core Programming', pct: '82%' },
                { name: 'HTML5', sub: 'Semantic Web Structure', pct: '95%' },
                { name: 'CSS3', sub: 'Modern Responsive Styling', pct: '90%' },
                { name: 'Tailwind CSS', sub: 'Utility-First Framework', pct: '92%' },
              ].map((s) => (
                <div key={s.name} className="glass-card">
                  <div className="skill-top">
                    <div>
                      <div className="skill-name">{s.name}</div>
                      <div className="skill-sub">{s.sub}</div>
                    </div>
                    <span className="skill-pct">{s.pct}</span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: s.pct }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {skillTab === 'tools' && (
            <div className="skill-grid">
              {[
                { name: 'Microsoft Word', sub: 'Documents & Academic Reports', pct: '92%' },
                { name: 'Microsoft Excel', sub: 'Spreadsheets & Data Analysis', pct: '85%' },
                { name: 'Microsoft PowerPoint', sub: 'Presentations & Pitch Decks', pct: '90%' },
              ].map((s) => (
                <div key={s.name} className="glass-card">
                  <div className="skill-top">
                    <div>
                      <div className="skill-name">{s.name}</div>
                      <div className="skill-sub">{s.sub}</div>
                    </div>
                    <span className="skill-pct">{s.pct}</span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: s.pct }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {skillTab === 'soft' && (
            <div className="skill-grid">
              {[
                { name: 'Analytical Problem-Solving', sub: 'Critical Thinking & Logic', pct: '90%' },
                { name: 'Technical Communication', sub: 'Documentation & Teamwork', pct: '88%' },
                { name: 'Bengali (Native)', sub: 'Reading, Writing & Speaking', pct: '100%' },
                { name: 'English (Professional)', sub: 'Working Proficiency', pct: '85%' },
              ].map((s) => (
                <div key={s.name} className="glass-card">
                  <div className="skill-top">
                    <div>
                      <div className="skill-name">{s.name}</div>
                      <div className="skill-sub">{s.sub}</div>
                    </div>
                    <span className="skill-pct">{s.pct}</span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: s.pct }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 05. Projects & Practical Work */}
        <section id="section-projects" className="sec-block">
          <RevealBox>
            <div className="proj-header">
              <div className="sec-label" style={{ marginBottom: 0 }}>05. Projects & Practical Work</div>
              <div className="filter-group">
                {filterCategories.map((cat) => (
                  <button
                    key={cat}
                    className={`filter-btn ${selectedFilter === cat ? 'active' : ''}`}
                    onClick={() => setSelectedFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </RevealBox>

          <div className="proj-stack">
            {filteredProjects.map((proj, idx) => (
              <RevealBox key={proj.title} delay={idx * 70}>
                <SpotlightProjectCard isLight={isLight}>
                  <div className="proj-chrome">
                    <div className="win-dots">
                      <span className="win-dot" style={{ background: 'rgba(239, 68, 68, 0.7)' }} />
                      <span className="win-dot" style={{ background: 'rgba(245, 158, 11, 0.7)' }} />
                      <span className="win-dot" style={{ background: 'rgba(16, 185, 129, 0.7)' }} />
                    </div>
                    <span className="proj-num">PROJECT // {proj.num}</span>
                  </div>

                  <div className="proj-top">
                    <div>
                      <h3 className="edu-title">{proj.title}</h3>
                      <p className="proj-sub">{proj.subtitle}</p>
                    </div>
                    <a href={proj.link} target="_blank" rel="noopener noreferrer" className="btn-demo">
                      Live Demo ↗
                    </a>
                  </div>
                  <p className="card-text" style={{ fontSize: '13px' }}>{proj.description}</p>
                  <div className="tech-row">
                    {proj.tech.map((t) => (
                      <span key={t} className="tech-pill">{t}</span>
                    ))}
                  </div>
                </SpotlightProjectCard>
              </RevealBox>
            ))}
          </div>
        </section>

        {/* 06. Contact & Connect */}
        <section id="section-contact" className="sec-block">
          <RevealBox>
            <div className="sec-label">06. Contact & Connect</div>
            <div className="glass-card">
              <div className="contact-top">
                <div>
                  <p className="edu-line"><span className="edu-muted">Phone:</span> <a href="tel:01759333003" style={{ color: '#0891b2', fontWeight: 600, textDecoration: 'none' }}>01759333003</a></p>
                  <p className="edu-line"><span className="edu-muted">Email:</span> <span style={{ color: '#9333ea', fontWeight: 600 }}>mhs2700823@gmail.com</span></p>
                </div>
                <button className="btn-jump" onClick={handleCopyEmail}>
                  {copiedEmail ? '✓ Email Copied!' : 'Copy Email Address'}
                </button>
              </div>

              <form onSubmit={handleQuickWhatsApp}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Send a Quick Direct Message:</p>
                <div className="form-grid">
                  <input
                    className="input-box"
                    type="text"
                    placeholder="Your Name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                  <input
                    className="input-box"
                    type="text"
                    placeholder="Write a short message..."
                    value={senderMsg}
                    onChange={(e) => setSenderMsg(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-wa">
                  <WhatsAppIcon color="#ffffff" size={16} />
                  <span>Send Instant Message on WhatsApp</span>
                </button>
              </form>

              <div className="social-row">
                <a href="mailto:mhs2700823@gmail.com" className="social-btn social-mail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ea4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>Email</span>
                </a>

                <a href="https://wa.me/8801759333003" target="_blank" rel="noopener noreferrer" className="social-btn social-wa">
                  <WhatsAppIcon color="#25d366" size={16} />
                  <span>WhatsApp</span>
                </a>

                <a href="https://www.linkedin.com/in/mehedi-hasan-seyam-7a8746430/" target="_blank" rel="noopener noreferrer" className="social-btn social-li">
                  <svg viewBox="0 0 24 24" fill="#0a66c2">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>

                <a href="https://www.facebook.com/share/1C8ETBtcdm/" target="_blank" rel="noopener noreferrer" className="social-btn social-fb">
                  <svg viewBox="0 0 24 24" fill="#1877f2">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                  </svg>
                  <span>Facebook</span>
                </a>

                <a href="https://www.instagram.com/seyam0010" target="_blank" rel="noopener noreferrer" className="social-btn social-ig">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#e4405f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </RevealBox>
        </section>
      </main>

      {cmdOpen && (
        <div className="modal-backdrop" onClick={() => setCmdOpen(false)}>
          <div className="cmd-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '8px' }}>
              <span style={{ color: '#9333ea', fontFamily: 'monospace' }}>&gt;_</span>
              <input
                type="text"
                autoFocus
                placeholder="Type section name or action..."
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div style={{ padding: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {commandActions.map((c, i) => (
                <button
                  key={i}
                  className="cmd-item"
                  onClick={() => {
                    c.action();
                    setCmdOpen(false);
                    setCmdQuery('');
                  }}
                >
                  <span>{c.label}</span>
                  <span style={{ color: '#9333ea' }}>↵</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {lightboxImg && (
        <div className="modal-backdrop" onClick={() => setLightboxImg(null)}>
          <img
            src={lightboxImg}
            alt="Profile Enlarged"
            style={{ maxWidth: '92%', maxHeight: '82vh', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)' }}
          />
        </div>
      )}

      {showBackToTop && (
        <button className="back-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="Back to Top">
          ↑
        </button>
      )}

      <footer style={{ position: 'relative', zIndex: 10, textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '32px', padding: '0 16px' }}>
        © {new Date().getFullYear()} Mehedi Hasan Seyam • Portfolio
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);