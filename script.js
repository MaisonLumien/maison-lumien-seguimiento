// Función principal de consulta - VERSIÓN CORREGIDA (busca por TÍTULO)
async function consultarSeguimiento(trackingNumber) {
    try {
        console.log('🔍 Consultando tracking:', trackingNumber);
        
        // Obtener TODOS los issues (sin filtro de labels)
        const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/issues?state=all`;
        
        const response = await fetch(url);
        const allIssues = await response.json();
        
        console.log('📦 Issues encontrados:', allIssues.length);
        
        // Buscar el issue cuyo título coincida exactamente con el tracking number
        const issue = allIssues.find(i => i.title === trackingNumber);
        
        if (issue) {
            console.log('✅ Issue encontrado:', issue.title);
            const data = JSON.parse(issue.body);
            return { success: true, data, issue };
        } else {
            console.log('❌ No se encontró issue con título:', trackingNumber);
            return { success: false, error: 'No encontrado' };
        }
    } catch (error) {
        console.error('Error consultando seguimiento:', error);
        return { success: false, error: 'Error de conexión' };
    }
}
