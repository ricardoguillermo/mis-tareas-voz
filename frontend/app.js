// 1. Configuración de Voz
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = Recognition ? new Recognition() : null;
if (recognition) {
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
}
const USUARIOS_AUTORIZADOS_VOZ = {
    "soy ricardo": "Ricardo",
    "soy diana": "Diana",
    "soy anibal": "Aníbal",
    "soy guille": "Guille",
};
const FRASES_AUTORIZADAS_VOZ = Object.keys(USUARIOS_AUTORIZADOS_VOZ);
let remitenteActual = "";
const MAX_TAREAS_SESION_VOZ = 10;
const DURACION_SESION_VOZ_MS = 30 * 60 * 1000;
let temporizadorSesionVoz = null;
const sesionVoz = {
    activa: false,
    venceEn: 0,
    tareasRestantes: 0,
};

function formatearTiempoRestanteSesion(msRestantes) {
    const totalSegundos = Math.max(0, Math.floor(msRestantes / 1000));
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function actualizarEstadoSesionVoz() {
    const estadoSesion = document.getElementById("estado-sesion-voz");
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion-voz");
    if (!estadoSesion) return;

    if (!sesionVoz.activa) {
        estadoSesion.textContent = "🔒 Acceso por voz cerrado.";
        estadoSesion.className = "estado-clave-voz";
        if (btnCerrarSesion) btnCerrarSesion.style.display = "none";
        return;
    }

    const msRestantes = sesionVoz.venceEn - Date.now();
    estadoSesion.textContent = `🔓 Sesion abierta: ${sesionVoz.tareasRestantes} tarea(s) o ${formatearTiempoRestanteSesion(msRestantes)}.`;
    estadoSesion.className = "estado-clave-voz ok";
    if (btnCerrarSesion) btnCerrarSesion.style.display = "inline-block";
}

function limpiarTemporizadorSesionVoz() {
    if (!temporizadorSesionVoz) return;
    clearInterval(temporizadorSesionVoz);
    temporizadorSesionVoz = null;
}

function cerrarSesionVoz(mensaje = "") {
    sesionVoz.activa = false;
    sesionVoz.venceEn = 0;
    sesionVoz.tareasRestantes = 0;
    limpiarTemporizadorSesionVoz();
    actualizarEstadoSesionVoz();
    if (mensaje) mostrarEstadoClave(mensaje, "");
}

function sesionVozDisponible() {
    if (!sesionVoz.activa) return false;

    if (Date.now() >= sesionVoz.venceEn) {
        cerrarSesionVoz("⌛ Se vencio el tiempo de acceso por voz.");
        return false;
    }

    if (sesionVoz.tareasRestantes <= 0) {
        cerrarSesionVoz("🔒 Se completo el limite de 10 tareas autorizadas.");
        return false;
    }

    return true;
}

function iniciarSesionVoz() {
    sesionVoz.activa = true;
    sesionVoz.venceEn = Date.now() + DURACION_SESION_VOZ_MS;
    sesionVoz.tareasRestantes = MAX_TAREAS_SESION_VOZ;
    limpiarTemporizadorSesionVoz();
    temporizadorSesionVoz = setInterval(() => {
        if (!sesionVozDisponible()) {
            const editor = document.getElementById("contenedor-editor");
            if (editor) editor.style.display = "none";
            return;
        }
        actualizarEstadoSesionVoz();
    }, 1000);
    actualizarEstadoSesionVoz();
}

function consumirUsoSesionVoz() {
    if (!sesionVozDisponible()) return;
    sesionVoz.tareasRestantes -= 1;
    if (sesionVoz.tareasRestantes <= 0) {
        cerrarSesionVoz("🔒 Se alcanzo el limite de 10 tareas. Vuelve a autenticar por voz para continuar.");
        return;
    }
    actualizarEstadoSesionVoz();
}

function cerrarSesionVozUsuario() {
    cerrarSesionVoz("🔒 Acceso por voz cerrado por vos.");
    const editor = document.getElementById("contenedor-editor");
    if (editor) editor.style.display = "none";
}

// document.getElementById("fecha-seleccionada").onchange = obtenerTareas;
// 2. Función para GUARDAR en MongoDB
// Antes: fetch('http://localhost:3000/tareas')
// Ahora:
// const urlBase = 'http://192.168.1.4:3000/tareas';
//https://maximus-inert-edgily.ngrok-free.dev
// Pega aquí la dirección que acabas de copiar de la terminal del puerto 3000
// const urlBase = 'https://maximus-inert-edgily.ngrok-free.app/tareas';
// En desarrollo con Live Server (127.0.0.1:5500) apuntamos al backend local
// const urlBase = "http://localhost:10000/tareas";
 const urlBase = "/tareas"; // Con esta ruta relativa, el frontend se adapta automáticamente al dominio donde esté alojado

async function guardarTareaEnNube(texto) {
  try {
    const response = await fetch(urlBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: texto,
        notas: "Ingresado por voz",
        chequeado: false,
      }),
    });

    const data = await response.json();
    console.log("Servidor dice:", data.mensaje);

    // Refrescamos la lista para ver la nueva tarea
    obtenerTareas();
  } catch (error) {
    console.error("Error al conectar con el servidor:", error);
  }
}

// obtenerTareas(); //solita?

function normalizarTexto(texto) {
    return (texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:!?¡¿]/g, "")
        .trim();
}

function mostrarEstadoClave(mensaje, tipo = "") {
    const estado = document.getElementById("estado-clave-voz");
    if (!estado) return;
    estado.textContent = mensaje;
    estado.className = `estado-clave-voz ${tipo}`.trim();
}

function obtenerRemitenteDesdeFrase(transcripcion) {
    const dicho = normalizarTexto(transcripcion);
    return USUARIOS_AUTORIZADOS_VOZ[dicho] || "";
}

function obtenerInicialRemitente(remitente) {
    const nombre = (remitente || "").trim();
    return nombre ? nombre.charAt(0).toUpperCase() : "?";
}

function extraerRemitenteDesdeNotas(notas) {
    if (!notas) return "";
    const match = String(notas).match(/\[autor:(.+?)\]/i);
    return match ? match[1].trim() : "";
}

function obtenerClaseColorRemitente(remitente) {
    const clave = normalizarTexto(remitente);
    if (clave === "ricardo") return "remitente-ricardo";
    if (clave === "diana") return "remitente-diana";
    if (clave === "anibal") return "remitente-anibal";
    if (clave === "guille") return "remitente-guille";
    return "remitente-default";
}

function escucharUnaVezPorVoz(callback) {
    if (!recognition) {
        callback(new Error("Reconocimiento de voz no soportado"));
        return;
    }

    let finalizado = false;
    recognition.onresult = (event) => {
        if (finalizado) return;
        finalizado = true;
        const voz = event.results[0][0].transcript;
        callback(null, voz);
    };

    recognition.onerror = () => {
        if (finalizado) return;
        finalizado = true;
        callback(new Error("No se pudo reconocer la voz"));
    };

    recognition.onend = () => {
        if (finalizado) return;
        finalizado = true;
        callback(new Error("No se detectó voz"));
    };

    try {
        recognition.start();
    } catch (error) {
        callback(error);
    }
}

function hablarConCallback(texto, callback) {
    const mensaje = new SpeechSynthesisUtterance(texto);
    mensaje.lang = "es-ES";
    mensaje.rate = 0.9;
    mensaje.onend = () => {
        if (typeof callback === "function") callback();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(mensaje);
}

function claveVozValida(transcripcion) {
    const dicho = normalizarTexto(transcripcion);
    return FRASES_AUTORIZADAS_VOZ.includes(dicho);
}

function abrirContenedorEditor() {
    const editor = document.getElementById("contenedor-editor");
    if (!editor) {
        console.error("No se encontró el contenedor-editor");
        return;
    }
    editor.style.display = "block";
    conectarMicrofono();
    const mensaje = remitenteActual
        ? `✅ Acceso autorizado para ${remitenteActual}`
        : "✅ Acceso por voz autorizado";
    mostrarEstadoClave(mensaje, "ok");
    actualizarEstadoSesionVoz();
}

function iniciarDesbloqueoPorVoz() {
    mostrarEstadoClave("🎤 Di: ingresa calve", "");

    if (!recognition) {
        const claveFallback = prompt("Tu navegador no soporta micrófono. Escribe una frase: soy Ricardo, soy Diana, soy Aníbal o soy Guille");
        const remitente = obtenerRemitenteDesdeFrase(claveFallback);
        if (remitente) {
            remitenteActual = remitente;
            iniciarSesionVoz();
            abrirContenedorEditor();
        } else {
            mostrarEstadoClave("❌ Clave incorrecta", "error");
        }
        return;
    }

    let intentos = 0;
    const maxIntentos = 2;

    const intentar = () => {
        mostrarEstadoClave("🎧 Escuchando contraseña...", "");
        escucharUnaVezPorVoz((error, voz) => {
            if (error) {
                intentos += 1;
                if (intentos < maxIntentos) {
                    mostrarEstadoClave("⚠️ No te escuché bien. Reintentando...", "error");
                    setTimeout(intentar, 500);
                } else {
                    mostrarEstadoClave("❌ No pude reconocer la voz. Toca '+ Nueva Tarea' para reintentar.", "error");
                }
                return;
            }

            const remitente = obtenerRemitenteDesdeFrase(voz);
            if (remitente) {
                remitenteActual = remitente;
                iniciarSesionVoz();
                abrirContenedorEditor();
                hablar(`Acceso autorizado, ${remitente}. Tenes hasta 10 tareas o 30 minutos.`);
                return;
            }

            mostrarEstadoClave("❌ Clave incorrecta. Usa: soy Ricardo, soy Diana, soy Aníbal o soy Guille.", "error");
        });
    };

    hablarConCallback("Di la contraseña por voz. ", intentar);
}

// 4. Iniciar el micrófono
// Usamos una función segura para conectar el micrófono
function conectarMicrofono() {
        const btnVoz = document.getElementById("btn-voz");
        if (!btnVoz) return;

        btnVoz.onclick = () => {
                escucharUnaVezPorVoz((error, voz) => {
                        if (error) {
                    mostrarEstadoClave("⚠️ No se pudo escuchar el dictado. Intenta nuevamente.", "error");
                                return;
                        }
                        const inputTitulo = document.getElementById("titulo-tarea");
                        if (inputTitulo) inputTitulo.value = voz;
                });
        };
}

async function actualizarEstado(id, estado) {
  try {
    await fetch(`${urlBase}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chequeado: estado }),
    });
    if (estado === true) {
      const mensaje = new SpeechSynthesisUtterance(
        "¡Qué bien! Terminamos esta actividad.",
      );
      mensaje.lang = "es-ES";
      window.speechSynthesis.speak(mensaje);
    }

    // Refrescamos la lista para que el estilo (tachado/color) se actualice
    obtenerTareas();
  } catch (error) {
    console.error("Error al actualizar:", error);
  }
}


// Nota: Las funciones mostrarSeccion y volverAlMenu se llaman desde el HTML
function hablar(texto) {
  const mensaje = new SpeechSynthesisUtterance(texto);
  mensaje.lang = "es-ES";
  mensaje.rate = 0.9; // Hablar un poquito más lento para mayor claridad
  window.speechSynthesis.speak(mensaje);
}

function abrirEditorSeguro() {
    if (sesionVozDisponible()) {
        abrirContenedorEditor();
        return;
    }
    iniciarDesbloqueoPorVoz();
}
 
function pedirClave() {
  const clave = prompt("Introduce la clave de familiar para editar:");

  // Usamos la clave que sugeriste
  if (clave === "Diana_hija" || clave === "Ricardo_esposo"|| clave === "Aníbal_hijo_menor"|| clave === "Guillermo_hijo_mayor") {
    document.getElementById("seccion-editor").style.display = "block";
    alert("Modo edición activado. Ahora puedes agregar tareas.");
  } else {
    alert("Clave incorrecta. Solo familiares autorizados.");
  }
}

// Modificamos volverAlMenu para que siempre vuelva a esconder el editor
function volverAlMenu() {
  // 1. Escondemos todas las secciones de contenido
  document.getElementById("lista-tareas").style.display = "none";
  document.getElementById("seccion-familia").style.display = "none";
  document.getElementById("seccion-musica").style.display = "none"; 
  document.getElementById("seccion-ayudas").style.display = "none"; 
//   lo puse yo
document.getElementById("seccion-compras").style.display = "none";
document.getElementById("cabecera-fija").style.display = "none"; // Aseguramos que el editor también se esconda

  // 2. IMPORTANTE: Cerramos el panel de edición por si quedó abierto
  document.getElementById("seccion-editor").style.display = "none";

  // 3. Mostramos el menú principal de iconos grandes
  document.getElementById("panel-tablet").style.display = "grid";
}

function reproducirAudio(nombreFamiliar) {
  const audio = new Audio(`audios/${nombreFamiliar}.mp3`);

  // Bajamos un poco el volumen de la música de fondo si la hubiera
  audio.play().catch((error) => {
    console.error("Error al reproducir el audio:", error);
    alert("Asegúrate de que el archivo existe en la carpeta /audios");
  });
}

let reproductor = document.getElementById("reproductor-radio");

function abrirRadio(url) {
    // Hablamos primero para que ella sepa qué está pasando
    hablar("Abriendo la radio en una pantalla nueva. Para volver aquí, solo tienes que cerrar la ventana.");
    
    // Abrimos la URL
    setTimeout(() => {
        window.open(url, '_blank');
    }, 1500); // Damos un segundo para que termine de hablar antes de cambiar
}

function detenerMusica() {
  const repro = document.getElementById("reproductor-radio");
  repro.pause();
  repro.src = "";
  hablar("Música apagada");
}



let modoNoRealizadasUltimos4Dias = false;

function actualizarTextoBotonFiltro4Dias() {
    const botonFiltro = document.getElementById('btn-filtro-4dias');
    if (!botonFiltro) return;

    botonFiltro.textContent = modoNoRealizadasUltimos4Dias
        ? '🕓 No realizadas (4 dias): ON'
        : '🕓 No realizadas (4 dias): OFF';
    botonFiltro.classList.toggle('activo', modoNoRealizadasUltimos4Dias);
}

async function obtenerTareasNoRealizadasUltimos4Dias() {
    try {
        const respuesta = await fetch(`${urlBase}?ultimosDias=4&noRealizadas=true`);
        const tareas = await respuesta.json();
        actualizarInterfazTareas(tareas);
    } catch (error) {
        console.error("Error al cargar tareas no realizadas de los ultimos 4 dias:", error);
    }
}

async function obtenerTareas() {
    if (modoNoRealizadasUltimos4Dias) {
        await obtenerTareasNoRealizadasUltimos4Dias();
        return;
    }

    const inputFecha = document.getElementById('fecha-seleccionada');
    if (!inputFecha) return;

    const fechaABuscar = inputFecha.value;

    try {
        const respuesta = await fetch(`${urlBase}?fecha=${encodeURIComponent(fechaABuscar)}`);
        const tareas = await respuesta.json();
        
        // Llamamos a la función que dibuja los checks en pantalla
        actualizarInterfazTareas(tareas);
    } catch (error) {
        console.error("Error al cargar tareas del dia:", error);
    }
}

function toggleNoRealizadasUltimos4Dias() {
    modoNoRealizadasUltimos4Dias = !modoNoRealizadasUltimos4Dias;
    actualizarTextoBotonFiltro4Dias();
    obtenerTareas();
}



function mostrarSeccion(idSeccion) {
    // 1. Agregamos 'seccion-compras' a la lista de secciones a ocultar
    const secciones = [
        'menu-principal', 
        'seccion-tareas', 
        'seccion-radios', 
        'seccion-familia', 
        'seccion-compras' // <--- Asegúrate de que coincida con el ID en tu HTML
    ];

    secciones.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });

    // 2. Mostramos la sección activa
    const activa = document.getElementById(idSeccion);
    if (activa) {
        activa.style.display = 'block';
    }

    // 3. Si entramos a tareas, mostramos también la lista de compras 
    // pero solo como un módulo dentro de esa sección si así lo prefieres
    if (idSeccion === 'seccion-tareas') {
        const compras = document.getElementById('seccion-compras');
        if (compras) compras.style.display = 'block';
        obtenerTareas(); 
    }
}

// Función para guardar lo que escribiste o dictaste
async function guardarTareaManual() {
    const titulo = document.getElementById("titulo-tarea").value;
    const notas = document.getElementById("notas-tarea").value;
    const fecha = document.getElementById("fecha-seleccionada").value;
    const remitente = remitenteActual || "Familiar";
    const notasConAutor = notas
        ? `${notas}\n[autor:${remitente}]`
        : `[autor:${remitente}]`;

    if (!titulo) return alert("Por favor, escribe o dicta una tarea.");

    try {
        const response = await fetch("https://mis-tareas-voz.onrender.com/tareas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                titulo: titulo, 
                notas: notasConAutor,
                remitente: remitente,
                fecha_creacion: fecha, // Guardamos con la fecha del calendario
                chequeado: false 
            }),
        });

        if (response.ok) {
            // 1. Limpiamos los campos
            document.getElementById("titulo-tarea").value = "";
            document.getElementById("notas-tarea").value = "";
            consumirUsoSesionVoz();
            // 2. Cerramos el editor azul
            document.getElementById('contenedor-editor').style.display = 'none';
            // 3. Refrescamos la lista de hoy
            obtenerTareas();
        }
    } catch (error) {
        console.error("Error al guardar:", error);
    }
}

// Conexión del Micrófono (dentro del DOMContentLoaded)
// 1. INICIO: Fecha de hoy y Menú Principal
window.addEventListener('DOMContentLoaded', () => {
    // Ponemos la fecha de hoy en el calendario
    const selector = document.getElementById('fecha-seleccionada');
    if (selector) {
        const hoy = new Date().toISOString().split('T')[0];
        selector.value = hoy;
        obtenerTareas();
    }
    actualizarTextoBotonFiltro4Dias();
    actualizarEstadoSesionVoz();
    // Forzamos ir al menú principal para que no se pisen las pantallas
    mostrarSeccion('menu-principal');
});

// 2. EDITOR SEGURO: Con verificación de ID
function abrirEditorSeguro() {
    if (sesionVozDisponible()) {
        abrirContenedorEditor();
        return;
    }
    iniciarDesbloqueoPorVoz();
}

// 1. Cambiamos el nombre de la función para que coincida con el error
async function alternarTarea(id, estado) {
  try {
    await fetch(`${urlBase}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chequeado: estado }),
    });
    
    if (estado === true) {
      hablar("¡Qué bien! Terminamos esta actividad.");
    }

    obtenerTareas(); // Refrescamos la lista
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
  }
}

// 2. Asegúrate que la interfaz llame a 'alternarTarea'
/* function actualizarInterfazTareas(tareas) {
    const contenedor = document.getElementById('lista-tareas');
    if (!contenedor) return;
    contenedor.innerHTML = "";

console.log("Actualizando interfaz con tareas:", tareas);
    if (tareas.length === 0) {
        contenedor.innerHTML = '<p class="mensaje-vacio">No hay tareas para este día.</p>';
        return;
    }


    tareas.forEach(tarea => {
        const div = document.createElement('div');
        div.className = 'tarea-card';
        div.innerHTML = `
            <div class="tarea-info">
                <input type="checkbox" ${tarea.chequeado ? 'checked' : ''} 
                       onchange="alternarTarea('${tarea._id}', this.checked)">
                <span class="${tarea.chequeado ? 'completada' : ''}">${tarea.titulo}</span>
            </div>
        `;
        contenedor.appendChild(div);
    });
} */

function actualizarInterfazTareas(tareas) {
    const contenedorGeneral = document.getElementById('lista-tareas');
    const contenedorCompras = document.getElementById('lista-compras'); 
    
    if (contenedorGeneral) contenedorGeneral.innerHTML = "";
    if (contenedorCompras) contenedorCompras.innerHTML = "";

    if (!Array.isArray(tareas) || tareas.length === 0) {
        if (contenedorGeneral) {
            contenedorGeneral.innerHTML = '<p class="mensaje-vacio">No hay tareas para mostrar.</p>';
        }
        return;
    }

    tareas.forEach(tarea => {
        // Limpiamos el texto para detectar "comprar" o "compra" sin errores
        const texto = tarea.titulo.trim().toLowerCase();
        const esCompra = texto.startsWith("comprar") || texto.startsWith("compra");
        const remitente = tarea.remitente || extraerRemitenteDesdeNotas(tarea.notas) || "?";
        const inicialRemitente = obtenerInicialRemitente(remitente);
        const colorRemitente = obtenerClaseColorRemitente(remitente);
        const etiquetaFecha = tarea.fecha_creacion
            ? `<small class="fecha-tarea">${tarea.fecha_creacion}</small>`
            : "";

        const div = document.createElement('div');
        div.className = 'tarea-card';
        div.innerHTML = `
            <div class="tarea-info" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div style="display:flex;align-items:center;gap:12px;">
                                    <span class="badge-remitente ${colorRemitente}" title="Enviada por ${remitente}">${inicialRemitente}</span>
                  <input type="checkbox" ${tarea.chequeado ? 'checked' : ''} 
                         onchange="alternarTarea('${tarea._id}', this.checked)">
                  <span class="${tarea.chequeado ? 'completada' : ''}">
                                            ${esCompra ? '🛒' : '📌'} ${tarea.titulo}
                  </span>
                                    ${etiquetaFecha}
                </div>
                <div>
                  <button class="btn-eliminar" onclick="eliminarTarea('${tarea._id}')">❌</button>
                </div>
            </div>
        `;

        // Mandamos la tarea al contenedor que le toca
        if (esCompra && contenedorCompras) {
            contenedorCompras.appendChild(div);
        } else if (contenedorGeneral) {
            contenedorGeneral.appendChild(div);
        }
    });
}
async function cargarRutinaRemedios() {
    const fecha = document.getElementById('fecha-seleccionada').value;
    const remedios = [
        "💊 Remedio Presión (Mañana)",
        "💊 Remedio Corazón (Almuerzo)",
        "💊 Gotas ojos (Noche)"
    ];

    hablar("Cargando los remedios del día.");

    for (const titulo of remedios) {
        await fetch(urlBase, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                titulo: titulo, 
                fecha_creacion: fecha, 
                chequeado: false 
            }),
        });
    }
    obtenerTareas(); // Refresca la lista al terminar
}

/* function actualizarInterfazTareas(tareas) {
    const contenedor = document.getElementById('lista-tareas');
    const contenedorCompras = document.getElementById('lista-compras'); // ¡Crea este div en tu HTML!
    console.log("Actualizando interfaz con tareas:", tareas);
    contenedor.innerHTML = "";
    if(contenedorCompras) contenedorCompras.innerHTML = "";

    tareas.forEach(tarea => {
        const esCompra = tarea.titulo.toLowerCase().startsWith("comprar") || 
                         tarea.titulo.toLowerCase().startsWith("compra");

        const div = document.createElement('div');
        div.className = esCompra ? 'tarea-card compra' : 'tarea-card';
        div.innerHTML = `
            <span>${esCompra ? '🛒' : '📌'} ${tarea.titulo}</span>
            <input type="checkbox" onchange="alternarTarea('${tarea._id}', this.checked)">
        `;

        // Si es compra, lo mandamos a la lista de compras, si no, a tareas
        if (esCompra && contenedorCompras) {
            console.log("Agregando a lista de compras:", tarea.titulo);
            contenedorCompras.appendChild(div);
            
        } else {
            contenedor.appendChild(div);
        }
    });
}
 */
function enviarListaWhatsApp() {
    const tareas = document.querySelectorAll('#lista-compras .tarea-card span');
    let texto = "*Lista de Supermercado - " + document.getElementById('fecha-seleccionada').value + "*\n";
    
    tareas.forEach(t => {
        texto += "- " + t.innerText.replace('🛒', '').trim() + "\n";
    });

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}

// Función para el Acordeón
function toggleAcordeon(id) {
    const contenido = document.getElementById(id);
    const item = contenido.parentElement;
    
    // Cerramos los demás si queremos que solo haya uno abierto
    // document.querySelectorAll('.acordeon-item').forEach(i => i.classList.remove('abierto'));

    item.classList.toggle('abierto');
}

// Actualizamos la navegación
function mostrarSeccion(idSeccion) {
    const secciones = ['menu-principal', 'seccion-tareas', 'seccion-radios', 'seccion-familia', 'seccion-ayuda'];
    
    secciones.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const activa = document.getElementById(idSeccion);
    if (activa) activa.style.display = 'block';
}
// Función para eliminar una tarea por su id
async function eliminarTarea(id) {
    if (!id) return console.error('ID inválido para eliminar');
    if (!confirm('¿Confirmás eliminar esta tarea?')) return;

    try {
        const res = await fetch(`${urlBase}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            obtenerTareas();
        } else {
            console.error('Error al eliminar tarea', res.status);
        }
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
    }
}

/* ==================== Funciones de lectura (Text-to-Speech) ==================== */
function leerTexto(texto) {
    if (!texto) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(texto);
    msg.lang = 'es-ES';
    msg.rate = 0.95;
    window.speechSynthesis.speak(msg);
}

function leerListaCompras() {
    const items = Array.from(document.querySelectorAll('#lista-compras .tarea-card span'))
        .filter(s => !s.classList.contains('completada'));
    if (!items || items.length === 0) return leerTexto('No hay elementos en la lista de supermercado.');
    let texto = 'Lista de supermercado. ';
    items.forEach((s, i) => {
        // limpiamos prefijos como emoji de carrito y la palabra "comprar/compra"
        let t = (s.innerText || '').trim();
        t = t.replace(/^\s*🛒\s*/i, '');
        t = t.replace(/^\s*(comprar|compra)\s+/i, '');
        texto += `Elemento ${i+1}: ${t}. `;
    });
    leerTexto(texto);
}

function leerActividadesDia() {
    const items = Array.from(document.querySelectorAll('#lista-tareas .tarea-card span'))
        .filter(s => !s.classList.contains('completada'));
    if (!items || items.length === 0) return leerTexto('No hay actividades para el día.');
    let texto = 'Actividades del día. ';
    items.forEach((s, i) => {
        // quitar emoji inicial y cualquier marcador como 📌
        let t = (s.innerText || '').trim();
        t = t.replace(/^\s*📌\s*/i, '');
        texto += `Actividad ${i+1}: ${t}. `;
    });
    leerTexto(texto);
}

function leerAyudas() {
    const medidas = document.getElementById('ayuda-medidas');
    const recetas = document.getElementById('ayuda-recetas');
    let texto = 'Ayudas para el día a día. ';
    if (medidas) texto += 'Medidas para la cocina: ' + medidas.innerText + '. ';
    if (recetas) texto += 'Recetas fáciles: ' + recetas.innerText + '. ';
    leerTexto(texto);
}