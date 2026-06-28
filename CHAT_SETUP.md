# Configuración del Chat con OpenAI

## ¿Qué se agregó?

Se integró un chat inteligente impulsado por OpenAI que aparece como un botón flotante en la invitación. Los invitados pueden hacer preguntas sobre el evento.

## Pasos para activar el chat

### 1. Obtener API Key de OpenAI

1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Inicia sesión con tu cuenta de OpenAI (o crea una)
3. Haz clic en **"Create new secret key"**
4. Copia la clave (⚠️ Solo se muestra una vez)

### 2. Usar el chat en desarrollo

Cuando alguien intente enviar un mensaje en el chat, el navegador te pedirá que pegues la API key. Esto se guarda en la sesión.

```
Para usar el chat, necesitás tu API key de OpenAI.
Obtenla en https://platform.openai.com/api-keys
```

### 3. Para producción (IMPORTANTE ⚠️)

**NUNCA** expongas la API key en el front-end. Debes:

1. Crear un endpoint en tu backend (Node.js con `server.cjs`)
2. El frontend envía el mensaje al backend
3. El backend lo envía a OpenAI
4. El backend devuelve la respuesta

**Ejemplo de endpoint seguro:**

```javascript
// En server.cjs, agregar:
const OpenAI = require('openai');

app.post('/api/chat', async (req, res) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  const message = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: req.body.messages,
    max_tokens: 150
  });
  
  res.json(message.choices[0].message);
});
```

Luego actualizar `chat.js` para usar este endpoint.

## Personalización del asistente

En `chat.js`, línea ~110, puedes modificar el `systemPrompt` para cambiar la personalidad del asistente:

```javascript
const systemPrompt = `Eres un asistente amable para una fiesta de 15 años...`;
```

## Costo

- **GPT-3.5-turbo**: ~$0.002 por 1000 tokens (muy barato)
- Se recomienda establecer un límite de gastos en OpenAI

## Archivos nuevos

- `chat.js` - Lógica del widget de chat
- Estilos en `styles.css` - Animaciones y diseño

## Troubleshooting

| Problema | Solución |
|----------|----------|
| El chat no aparece | Verifica que `chat.js` está en el `<script>` final del HTML |
| "Error en OpenAI" | Confirma que la API key es válida y tiene créditos |
| CORS error | Debes usar un backend proxy para las llamadas a OpenAI en producción |
| Chat muy lento | Normal para GPT-3.5, usa `gpt-4-turbo` si quieres más rápido (pero cuesta más) |

## Contacto

Cualquier duda sobre la integración, contacta a BloomDate.
