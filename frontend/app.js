// 1. Configuración de Voz
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new Recognition(); // <--- Aquí se define
recognition.lang = "es-ES";

const btn = document.querySelector("#btn-voz");
const MIinput = document.getElementById("tarea-texto");

document.getElementById("filtro-fecha").onchange = obtenerTareas;
// 2. Función para GUARDAR en MongoDB
// Antes: fetch('http://localhost:3000/tareas')
// Ahora:
// const urlBase = 'http://192.168.1.4:3000/tareas';
//https://maximus-inert-edgily.ngrok-free.dev
// Pega aquí la dirección que acabas de copiar de la terminal del puerto 3000
// const urlBase = 'https://maximus-inert-edgily.ngrok-free.app/tareas';
const urlBase = "https://mis-tareas-voz.onrender.com/tareas";

async function guardarTareaEnNube(texto) {
    try {
        const response = await fetch(urlBase, { 
            method: 'POST',
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




  obtenerTareas();


// 3. Evento cuando terminas de hablar

// Al recibir voz, solo llenamos el campo para que puedas editarlo
recognition.onresult = (event) => {
    const voz = event.results[0][0].transcript;
    document.getElementById('tarea-titulo').value = voz;
};

// Función para guardar lo que esté en los campos (Voz editada o Texto manual)
document.getElementById('btn-guardar').onclick = async () => {
    const titulo = document.getElementById('tarea-titulo').value;
    const notas = document.getElementById('tarea-notas').value;

    if (!titulo) return alert("El título es obligatorio");

    try {
        const response = await fetch(urlBase, { 
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titulo, notas, chequeado: false }),
        });
        
        if (response.ok) {
            // Limpiamos los campos y refrescamos la lista
            document.getElementById('tarea-titulo').value = '';
            document.getElementById('tarea-notas').value = '';
            obtenerTareas(); 
        }
    } catch (error) {
        console.error("Error al guardar:", error);
    }
};
3.
// 4. Iniciar el micrófono
btn.onclick = () => {
  recognition.start();
  console.log("Escuchando...");
};

async function obtenerTareas() {
  try {
    const fechaSeleccionada = document.getElementById("filtro-fecha").value;
    // Enviamos la fecha como parámetro al backend
    const res = await fetch(`${urlBase}?fecha=${fechaSeleccionada}`);
    const tareas = await res.json();
    // Recuerda usar urlBase si estás probando con el celular/Ngrok
    /* const res = await fetch(urlBase);
    const tareas = await res.json(); */
    const lista = document.getElementById("lista-tareas");
    lista.innerHTML = "";

    tareas.forEach(tarea => {
    const item = document.createElement('li');
    
    item.className = `tarea-item ${tarea.chequeado ? "completada" : ""}`;

    item.innerHTML = `
        <div style="display: flex; align-items: center; width: 100%;">
            <input type="checkbox" 
                   ${tarea.chequeado ? "checked" : ""} 
                   onchange="actualizarEstado('${tarea._id}', this.checked)"
                   style="width: 25px; height: 25px; cursor: pointer;">
            
            <div style="flex-grow: 1; margin-left: 15px;">
                <span style="${tarea.chequeado ? "text-decoration: line-through; color: #95a5a6;" : "font-weight: 500;"}">
                    ${tarea.titulo}
                </span>
                <small class="nota-texto" style="display: block;">
                    ${tarea.notas || "Sin comentarios"}
                </small>
            </div>
        </div>
    `;
    lista.appendChild(item);
});
  } catch (error) {
    console.error("Error al cargar tareas:", error);
  }
}

async function actualizarEstado(id, estado) {
  try {
    await fetch(`${urlBase}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chequeado: estado }),
    });

    // Refrescamos la lista para que el estilo (tachado/color) se actualice
    obtenerTareas();
  } catch (error) {
    console.error("Error al actualizar:", error);
  }
}
// Llama a esta función al final de 'guardarTareaEnNube' para que se actualice sola