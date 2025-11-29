/**
 * Theme Customizer - Permite a los usuarios personalizar los colores del tema
 * Guarda las preferencias en localStorage
 */

class ThemeCustomizer {
  constructor() {
    this.defaultTheme = {
      'accent': '#ff6b9a',
      'accent-2': '#d83a7a',
      'accent-light': '#ff8bb5',
      'text': '#e8eaf6',
      'muted': '#8b92a9',
      'border': 'rgba(255, 255, 255, 0.05)',
      'panel': 'rgba(19, 26, 58, 0.8)',
      'card': 'rgba(26, 36, 73, 0.9)',
      'bg-dark': '#000000',
      'bg-blue': '#000033',
      'bg-yellow': '#333300'
    };
    
    this.loadTheme();
    this.createCustomizerUI();
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('cherry_custom_theme');
    if (savedTheme) {
      this.currentTheme = JSON.parse(savedTheme);
    } else {
      this.currentTheme = { ...this.defaultTheme };
    }
    this.applyTheme();
  }

  saveTheme() {
    localStorage.setItem('cherry_custom_theme', JSON.stringify(this.currentTheme));
  }

  applyTheme() {
    const root = document.documentElement;
    Object.keys(this.currentTheme).forEach(key => {
      root.style.setProperty(`--${key}`, this.currentTheme[key]);
    });
  }

  createCustomizerUI() {
    // Crear el botón para abrir el customizer
    const customizerBtn = document.createElement('button');
    customizerBtn.id = 'customizerBtn';
    customizerBtn.className = 'btn-ghost';
    customizerBtn.title = 'Personalizar Tema';
    customizerBtn.textContent = '🎨';
    customizerBtn.style.cssText = `
      position: relative;
      z-index: 1001;
    `;

    // Crear el modal de personalización
    const modal = document.createElement('div');
    modal.id = 'themeCustomizerModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      backdrop-filter: blur(5px);
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: var(--panel);
      border: 2px solid var(--accent);
      border-radius: 16px;
      padding: 24px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 0 30px rgba(255, 107, 154, 0.3);
      color: var(--text);
    `;

    const title = document.createElement('h2');
    title.textContent = 'Personalizar Tema';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: var(--text);
      text-shadow: 0 0 10px var(--accent);
    `;

    const colorGrid = document.createElement('div');
    colorGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    `;

    // Crear inputs de color para cada variable CSS
    Object.keys(this.currentTheme).forEach(key => {
      const colorLabel = document.createElement('label');
      colorLabel.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: var(--text);
        font-size: 12px;
        font-weight: 600;
      `;

      const labelText = document.createElement('span');
      labelText.textContent = key.replace(/-/g, ' ').toUpperCase();
      labelText.style.cssText = `
        text-transform: capitalize;
      `;

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = this.rgbToHex(this.currentTheme[key]);
      colorInput.style.cssText = `
        width: 100%;
        height: 40px;
        border: 2px solid var(--accent);
        border-radius: 8px;
        cursor: pointer;
      `;

      colorInput.addEventListener('input', (e) => {
        this.currentTheme[key] = e.target.value;
        this.applyTheme();
      });

      colorLabel.appendChild(labelText);
      colorLabel.appendChild(colorInput);
      colorGrid.appendChild(colorLabel);
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      margin-top: 20px;
      justify-content: flex-end;
    `;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Guardar';
    saveBtn.style.cssText = `
      background: linear-gradient(90deg, var(--accent), var(--accent-2));
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    `;
    saveBtn.addEventListener('click', () => {
      this.saveTheme();
      alert('Tema guardado correctamente');
      modal.style.display = 'none';
    });

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Restablecer';
    resetBtn.style.cssText = `
      background: transparent;
      color: var(--muted);
      border: 1px solid var(--border);
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    `;
    resetBtn.addEventListener('click', () => {
      this.currentTheme = { ...this.defaultTheme };
      this.applyTheme();
      this.loadTheme(); // Recargar los inputs
      location.reload(); // Recargar la página para reflejar los cambios
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cerrar';
    closeBtn.style.cssText = `
      background: transparent;
      color: var(--muted);
      border: 1px solid var(--border);
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    `;
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(resetBtn);
    buttonContainer.appendChild(closeBtn);

    modalContent.appendChild(title);
    modalContent.appendChild(colorGrid);
    modalContent.appendChild(buttonContainer);

    modal.appendChild(modalContent);

    // Cerrar el modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Añadir el botón al header
    customizerBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });

    // Insertar el botón en el header
    document.addEventListener('DOMContentLoaded', () => {
      const headerRight = document.querySelector('.header-right');
      if (headerRight) {
        headerRight.insertBefore(customizerBtn, headerRight.firstChild);
      }
      document.body.appendChild(modal);
    });
  }

  rgbToHex(rgb) {
    // Si ya es un hex, devolverlo
    if (rgb.startsWith('#')) {
      return rgb;
    }
    
    // Si es rgba, extraer los valores
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) {
      return '#ff6b9a'; // Color por defecto
    }

    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);

    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
}

// Inicializar el customizer cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ThemeCustomizer();
  });
} else {
  new ThemeCustomizer();
}
