// script.js - Sistema de seguimiento Maison Lumien (VERSIÓN CORREGIDA)

const GITHUB_USER = 'MaisonLumien';
const GITHUB_REPO = 'maison-lumien-seguimiento';

// Estados predefinidos
const ESTADOS = {
    'recibido_por_ti': { icon: '📦', label: 'Recibido por Maison', color: '#4F46E5' },
    'en_transito': { icon: '🚚', label: 'En tránsito', color: '#F59E0B' },
    'en_ciudad_destino': { icon: '🏙️', label: 'En ciudad destino', color: '#3B82F6' },
    'en_reparto': { icon: '🚚', label: 'En reparto', color: '#8B5CF6' },
    'entregado': { icon: '✅', label: 'Entregado', color: '#10B981' },
    'devuelto': { icon: '↩️', label: 'Devuelto', color: '#EF4444' }
};

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

async function consultarSeguimiento(trackingNumber) {
    try {
        console.log('🔍 Consultando tracking:', trackingNumber);
        
        // Timeout de 5 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/issues?state=all`;
        console.log('📡 URL:', url);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const allIssues = await response.json();
        console.log('📦 Total issues encontrados:', allIssues.length);
        
        // Buscar TODOS los issues con el título exacto
        const issuesEncontrados = allIssues.filter(i => i.title === trackingNumber);
        console.log('🎯 Issues con título coincidente:', issuesEncontrados.length);
        
        if (issuesEncontrados.length === 0) {
            return { success: false, error: 'No se encontró el número de seguimiento' };
        }
        
        // Tomar el más reciente (por fecha de creación)
        const issue = issuesEncontrados.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        )[0];
        
        console.log('✅ Usando issue #' + issue.number);
        
        // Parsear el JSON del cuerpo
        try {
            const data = JSON.parse(issue.body);
            
            // Verificar que el JSON tenga la estructura esperada
            if (!data.cliente || !data.pedido || !data.envio || !data.historial) {
                throw new Error('El JSON no tiene la estructura esperada');
            }
            
            // Cargar comentarios si existen
            let comments = [];
            if (issue.comments > 0) {
                const commentsUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/issues/${issue.number}/comments`;
                const commentsResponse = await fetch(commentsUrl);
                comments = await commentsResponse.json();
                console.log('💬 Comentarios cargados:', comments.length);
            }
            
            return { success: true, data, issue, comments };
            
        } catch (parseError) {
            console.error('Error parseando JSON:', parseError);
            return { 
                success: false, 
                error: 'El formato del seguimiento es inválido. Contacta a soporte.' 
            };
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        return { success: false, error: 'Error de conexión: ' + error.message };
    }
}

function mostrarSeguimiento(data, issue, comments) {
    const container = document.getElementById('successState');
    
    // Obtener estado actual
    const estadoInfo = ESTADOS[data.envio.estado_actual] || { 
        icon: '📦', 
        label: data.envio.estado_actual.replace(/_/g, ' ') 
    };
    
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
    
    // Agregar historial (ordenado de más reciente a más antiguo)
    const historialOrdenado = [...data.historial].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );
    
    historialOrdenado.forEach((evento) => {
        const estadoEv = ESTADOS[evento.estado] || { 
            icon: '📦', 
            label: evento.estado.replace(/_/g, ' ') 
        };
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
    
    // Agregar comentarios como actualizaciones
    if (comments && comments.length > 0) {
        comments.forEach(comment => {
            // Ignorar comentarios que sean JSON
            if (!comment.body.includes('{') && comment.body.trim() !== '') {
                html += `
                    <div class="timeline-item">
                        <div class="timeline-icon">💬</div>
                        <div class="timeline-content">
                            <div class="timeline-date">${new Date(comment.created_at).toLocaleString('es-CO')}</div>
                            <div class="timeline-desc">${comment.body}</div>
                        </div>
                    </div>
                `;
            }
        });
    }
    
    html += `</div>`;
    
    // Información de envío
    html += `
        <div class="envio-info">
            <h3 style="color: white; margin: 30px 0 20px;">📋 Detalles del envío</h3>
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
                    <span class="info-label">Pedido</span>
                    <span class="info-value">${data.pedido.numero}</span>
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

async function initSeguimiento() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const successState = document.getElementById('successState');
    
    const trackingNumber = getUrlParameter('track');
    console.log('🔍 Tracking desde URL:', trackingNumber);
    
    if (!trackingNumber) {
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        errorState.querySelector('p').textContent = 'No se proporcionó número de seguimiento';
        return;
    }
    
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    successState.style.display = 'none';
    
    const resultado = await consultarSeguimiento(trackingNumber);
    console.log('📦 Resultado:', resultado);
    
    loadingState.style.display = 'none';
    
    if (resultado.success) {
        mostrarSeguimiento(resultado.data, resultado.issue, resultado.comments);
    } else {
        errorState.style.display = 'block';
        const errorMsg = errorState.querySelector('p');
        if (errorMsg) {
            errorMsg.textContent = resultado.error;
        }
    }
}

// Función para la página principal
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
