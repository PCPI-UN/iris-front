---
description: Reglas y restricciones estrictas para el desarrollo del frontend de Iris
globs: ["**/*"]
always_on: true
---

# Reglas de Desarrollo - Iris Frontend

Al trabajar en este repositorio, el asistente DEBE cumplir estrictamente con los siguientes principios:

1. **Código preexistente intocable**: El código existente permanece igual a menos que el desarrollador indique explícitamente lo contrario. Para modificar código original existente, se debe preguntar y obtener autorización previa.
2. **Consistencia de identidad visual**: Mantener rigurosamente la identidad visual, componentes base (HeroUI/Tailwind) y estilos del proyecto en cualquier nueva vista.
3. **Cero operaciones de Git**: No realizar commits ni manipulaciones del repositorio git; el versionado lo gestiona exclusivamente el desarrollador.
4. **Explicación previa y alcance acotado**: Antes de codificar, explicar detalladamente qué se va a realizar y desarrollar estricta y únicamente esa parte aprobada.
5. **Desarrollo incremental por característica**: El diseño y la lógica se construyen feature por feature, de forma progresiva, nunca de golpe.
6. **Consultas directas**: Ante cualquier duda técnica, funcional o de alcance, preguntar directamente al desarrollador.
7. **Análisis de interconexión crítica**: Evaluar siempre las dependencias y la interconexión entre módulos antes de intervenir.
8. **Respeto estricto a la API backend**: No esperar ni asumir contratos distintos a los existentes en el backend. Si se requiere un nuevo endpoint, justificarlo al desarrollador para que lo tramite con el equipo de backend.
9. **Apoyo en documentación existente**: Investigar y apoyarse en `README.md`, tipos de datos y especificaciones antes de implementar.
10. **Memoria externa al proyecto**: Mantener el archivo de memoria en el directorio de sesión del agente (`brain`), sin guardarlo jamás dentro del repositorio.
11. **Orquestación y subagentes prudente**: Lanzar subagentes únicamente cuando sea indispensable, cuidando el consumo de recursos/créditos.
12. **Mejores prácticas frontend**: Arquitectura modular feature-based, tipado estricto en TypeScript, accesibilidad y componentes limpios.

