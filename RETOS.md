# Sistema de Retos – Especificacion UX / UI

Este documento describe el **sistema de Retos** y su diseno UX/UI.
El objetivo es permitir que las parejas propongan experiencias de forma **segura, flexible y gamificada**, sin presion ni friccion, incluso con grandes conjuntos de cartas.

El sistema esta disenado para **parejas reales**, a menudo con hijos, tiempo limitado y diferentes niveles de comodidad.

---

## Principios Fundamentales

- El consentimiento es parte del juego, no un extra
- La mayoria de acciones toman **segundos**, no minutos
- La complejidad aparece **solo cuando es necesaria**
- Las cartas inspiran retos, pero **no los fuerzan**
- Las recompensas otorgan **derechos o prioridad**, nunca obligacion

---

## Tipos de Retos

Existen **tres niveles de retos**, cada uno con mayor profundidad e intencion.

| Tipo | Uso | Complejidad | % de uso |
|----|----|----|----|
| Reto Simple | Juego diario | Muy baja | ~60–70% |
| Reto Guiado | Intencion y control ligero | Media | ~20–30% |
| Reto Personalizado | Exploracion / dinamicas sensibles | Alta | ~10–15% |

---

## 1. Retos Simples (Nivel 1)

### Proposito
Retos rapidos y sin friccion que mantienen el juego vivo incluso en dias ocupados.

### Caracteristicas
- No requiere negociacion
- Dinamicas seguras y familiares
- Se puede crear en **menos de 10 segundos**
- Puede derivarse de cartas **o crearse libremente**

### UX / UI

#### Puntos de entrada
- Desde una carta → "Convertir en Reto"
- Boton global → "Crear Reto"

#### Campos del formulario
- **Titulo** (requerido)
- **Descripcion corta** (opcional)

Sin pasos adicionales.
Sin recompensas requeridas.

---

### Ejemplos (mostrados como inspiracion)

**Ejemplo 1**
**Titulo:** Esta noche, yo guio
**Descripcion:** Hoy tomo el control por un rato y tu solo sigues.

**Ejemplo 2**
**Titulo:** Placer lento
**Descripcion:** Me concentro solo en darte placer, sin prisas.

**Ejemplo 3**
**Titulo:** Mentalidad de hotel
**Descripcion:** Por una hora, olvidamos todo y solo nos disfrutamos.

---

## 2. Retos Guiados (Nivel 2)

### Proposito
Introducir intencion, control o intimidad sin abrumar al usuario.

### Caracteristicas
- Estructura ligera
- Aun rapido de crear
- Agrega contexto emocional
- Ideal para dominancia suave o placer enfocado

### UX / UI

Al seleccionarlo, la UI se expande para mostrar **campos adicionales opcionales**.

#### Campos del formulario
1. **Cual es el reto?** (requerido)
2. **Por que lo propongo** (opcional)
3. **Un limite claro** (requerido, seleccionable o personalizado)

#### Opciones de limites
- "Paramos si algo se siente incomodo"
- "Sin dolor"
- "Solo por X minutos"

Los campos son colapsables y omitibles cuando es posible.

---

### Ejemplos (mostrados como inspiracion)

**Ejemplo 1**
**Reto:** Guio tu cuerpo sin que tu decidas nada.
**Por que:** Me gusta verte relajarte y dejarte llevar.
**Limite:** Paramos cuando quieras.

**Ejemplo 2**
**Reto:** Una noche enfocada solo en tu placer.
**Por que:** Me excita verte disfrutar.
**Limite:** Sin prisa, sin expectativas.

**Ejemplo 3**
**Reto:** Yo decido cuando y como te desvistes.
**Por que:** Disfruto jugar con la anticipacion.
**Limite:** Solo lo que te haga sentir comoda/o.

---

## 3. Retos Personalizados (Nivel 3)

### Proposito
Usados para:
- Nuevas exploraciones
- Ataduras suaves / control
- Fantasias sensibles
- Dinamicas de alta confianza

### Caracteristicas
- Usa una plantilla guiada completa
- Cuesta creditos (ej. Venus)
- Se propone con menos frecuencia
- Se siente especial e intencional

---

### Patron UX / UI: Wizard (Paso a paso)

El usuario nunca ve todos los campos a la vez.

#### Paso 1 – Intencion
- Que estas proponiendo?
- Por que es importante para ti?

#### Paso 2 – Contexto
- Lugar (hotel / escapada / donde sea)
- Duracion aproximada

#### Paso 3 – Limites
Basado en checkboxes + texto opcional:
- Sin dolor
- Palabra de seguridad
- Podemos parar cuando quiera
- Otro

#### Paso 4 – Recompensa (opcional)
- Venus
- Cupon
- Derecho a elegir el proximo reto
- Ninguna

#### Paso 5 – Confirmacion
Un resumen legible:
> "Esto es lo que estas proponiendo"

Accion final:
> Enviar reto

---

### Ejemplos (mostrados como inspiracion)

**Ejemplo 1**
**Intencion:** Quiero atarte las manos suavemente y guiarte.
**Por que:** Me excita cuando confias en mi y te dejas llevar.
**Contexto:** Habitacion de hotel, unos 30 minutos.
**Limites:** Sin dolor, palabra de seguridad acordada.
**Recompensa:** Tu eliges el proximo reto.

**Ejemplo 2**
**Intencion:** Te llevo cerca del climax varias veces antes de dejarte llegar.
**Por que:** Disfruto controlar el ritmo de tu placer.
**Contexto:** Hotel o espacio privado.
**Limites:** Puedes parar cuando quieras.
**Recompensa:** Un cupon a tu eleccion.

---

## Relacion Cartas → Retos

- Las cartas son **disparadores de ideas**, no acciones obligatorias
- Una carta puede:
  - Convertirse en un Reto Simple
  - Expandirse en un Reto Guiado
  - Usarse como inspiracion para un Reto Personalizado
- Las cartas nunca fuerzan un reto

### UI de Detalle de Carta
Botones:
- Convertir en reto
- Guardar para despues
- Hablar sobre esto

---

## Crear Retos sin Cartas

El sistema permite:
- Creacion totalmente libre
- Sin dependencia de cartas
- Ideal para espontaneidad

Punto de entrada:
> "Crear Reto"

El usuario elige:
- Simple
- Guiado
- Personalizado

---

## Recompensas y Balance (Resumen)

- Los retos crean **experiencias**
- Las recompensas crean **derechos**, no obligaciones
- Los Venus permiten:
  - Prioridad
  - Desbloquear retos personalizados
  - Activar cupones

Los retos personalizados pueden:
- Otorgar un derecho temporal (elegir el proximo reto)
- Otorgar un cupon seleccionado por el receptor
- Otorgar venus

---

## Salvaguardas UX

- Ningun reto fuerza aceptacion
- "No" siempre es valido y nunca penalizado
- Los campos opcionales nunca son obligatorios a menos que sean necesarios para seguridad
- La complejidad es progresiva, nunca impuesta

---

## Resumen

- La mayoria de los retos son rapidos y simples
- La profundidad esta disponible, no forzada
- Las cartas escalan a miles sin friccion
- El consentimiento, la confianza y la comunicacion estan integrados en el sistema
- La UX soporta tanto dinamicas juguetonas como intimas

Este sistema esta disenado para sentirse **natural, respetuoso y emocionante**, incluso en relaciones de largo plazo.
