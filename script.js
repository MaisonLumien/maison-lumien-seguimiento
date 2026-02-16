// script.js - Lógica del sistema de seguimiento

// Configuración
const GITHUB_USER = 'MaisonLumien'; // ⚠️ CAMBIA ESTO POR TU USUARIO
const GITHUB_REPO = 'maison-lumien-seguimiento';
const GITHUB_TOKEN = null; // No necesitas token para consultas públicas

// Estados predefinidos con iconos y colores
const ESTADOS = {
    'recibido_por_ti': { icon: '📦', label: 'Recibido por Maison', color: '#4F46E5' },
    'en_transito': { icon: '🚚', label: 'En tránsito', color: '#F59E0B' },
    'en_ciudad_destino': { icon: '🏙️', label: 'En ciudad destino', color: '#3B82F6' },
    'en_reparto': { icon: '🚚', label: 'En reparto', color: '#8B5CF6' },
    'entregado': { icon: '✅', label: 'Entregado', color: '#10B981' },
    'devuelto': { icon: '↩️', label: 'Devuelto', color: '#EF4444' }
};

// Función para obtener parámetro de URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Función principal de consulta
async function consultarSeguimiento(trackingNumber) {
    try {
        console.log('🔍 Consultando tracking:', trackingNumber);
        
        // Construir URL de GitHub API
        const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/issues?labels=${trackingNumber}`;
        
        const response = await fetch(url);
        const issues = await response.json();
        
        if (issues && issues.length > 0) {
            const issue = issues[0];
            const data = JSON.parse(issue.body);
            return { success: true, data, issue };
        } else {
            return { success: false, error: 'No encontrado' };
        }
    } catch (error) {
        console.error('Error consultando seguimiento:', error);
        return { success: false, error: 'Error de conexión' };
    }
}

// Función para mostrar los datos en la página
function mostrarSeguimiento(data, issue) {
    const container = document.getElementById('successState');
    
    // Obtener etiqueta actual (estado)
    const estadoActual = issue.labels.length > 0 ? issue.labels[0].name : 'recibido_por_ti';
    const estadoInfo = ESTADOS[data.envio.estado_actual] || { icon: '📦', label: data.envio.estado_actual };
    
    // Construir HTML
    let html = `
        <div class="tracking-header">
            <div class="tracking-number">
                ${data.envio.tracking_aliexpress}
                <span>${estadoInfo.icon} ${estadoInfo.label}</span>
            </div>
            <div class="cliente-info">
                ${data.cliente.nombre} - ${data.cliente.telefono}
            </div>
        </div>
        
        <div class="timeline">
    `;
    
    // Agregar historial cronológico
    data.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    data.historial.forEach((evento, index) => {
        const estadoEv = ESTADOS[evento.estado] || { icon: '📦', label: evento.estado };
        html += `
            <div class="timeline-item">
                <div class="timeline-icon">${estadoEv.icon}</div>
                <div class="timeline-content">
                    <div class="timeline-date">${evento.fecha}</div>
                    <div class="timeline-title">${estadoEv.label}</div>
                    <div class="timeline-desc">${evento.descripcion}</div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    
    // Información de envío
    html += `
        <div class="envio-info">
            <h3 style="color: white; margin-bottom: 20px;">📋 Detalles del envío</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Producto</span>
                    <span class="info-value">${data.pedido.producto}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Color</span>
                    <span class="info-value">${data.pedido.color || 'No especificado'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Tracking AliExpress</span>
                    <span class="info-value">${data.envio.tracking_aliexpress}</span>
                </div>
    `;
    
    if (data.reenvio.transportadora) {
        html += `
                <div class="info-item">
                    <span class="info-label">Transportadora local</span>
                    <span class="info-value">${data.reenvio.transportadora}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Guía local</span>
                    <span class="info-value">${data.reenvio.tracking_local}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Fecha envío</span>
                    <span class="info-value">${data.reenvio.fecha_envio}</span>
                </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    container.style.display = 'block';
}

// Función principal para la página de seguimiento
async function initSeguimiento() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const successState = document.getElementById('successState');
    
    const trackingNumber = getUrlParameter('track');
    
    if (!trackingNumber) {
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        errorState.querySelector('p').textContent = 'No se proporcionó número de seguimiento';
        return;
    }
    
    // Mostrar loading
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    successState.style.display = 'none';
    
    // Consultar
    const resultado = await consultarSeguimiento(trackingNumber);
    
    loadingState.style.display = 'none';
    
    if (resultado.success) {
        mostrarSeguimiento(resultado.data, resultado.issue);
    } else {
        errorState.style.display = 'block';
    }
}

// Función para la página principal (búsqueda)
function initIndex() {
    const searchButton = document.getElementById('searchButton');
    const trackingInput = document.getElementById('trackingInput');
    
    if (searchButton && trackingInput) {
        const buscar = () => {
            const tracking = trackingInput.value.trim();
            if (tracking) {
                window.location.href = `seguimiento.html?track=${encodeURIComponent(tracking)}`;
            } else {
                alert('Por favor ingresa un número de seguimiento');
            }
        };
        
        searchButton.addEventListener('click', buscar);
        trackingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                buscar();
            }
        });
    }
}

// Inicializar según la página
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('seguimiento.html')) {
        initSeguimiento();
    } else {
        initIndex();
    }

});
