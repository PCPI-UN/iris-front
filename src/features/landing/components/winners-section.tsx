'use client';

import { RefObject, useState } from 'react';
import { Trophy, Award, Users, Calendar, ArrowRight, Star } from 'lucide-react';
import { GlassCard } from './glass-card';
import { Button } from '@/components/ui/button';
import type { EngineeringField } from '../types';
import { engineeringFields } from '../constants';

interface WinnersSectionProps {
  winnersSectionRef: RefObject<HTMLElement>;
}

// Example data for winners (replace with real data as needed)
const winnersData = [
  {
    engineeringId: 1,
    projectTitle: 'Sistema de Alerta de Deserción Estudiantil',
    teamMembers: ['Esteban Ramírez', 'Jean Herrán', 'Juan Pineda'],
    description: 'Este proyecto desarrolla un sistema de alerta temprana que predice el riesgo de deserción estudiantil mediante técnicas de Machine Learning. El sistema desplegado en producción genera alertas personalizadas y explica factores contribuyentes, permitiendo intervenciones preventivas por coordinadores académicos y bienestar institucional.',
    year: '2025-30',
    posterUrl: 'https://irislab.blob.core.windows.net/irislabcontainer/1764015659802-Poster%20_SADE_Feria.png?sv=2025-11-05&se=2026-11-24T20%3A20%3A59Z&sr=b&sp=r&sig=vMMb3PKpGfoQo0MND4BJAHBFvV5DffN7lh3NughxDrA%3D',
  },
  {
    engineeringId: 2,
    projectTitle: 'Gestión sostenible del riesgo climático',
    teamMembers: ['Dayana Torres', 'Luis Márquez'],
    description: 'El proyecto evalúa la vulnerabilidad del arroyo de la calle 84 en Barranquilla para mejorar su resiliencia ante el cambio climático. Mediante QGIS, HEC-HMS y HEC-RAS se analiza su comportamiento hidrológico e hidráulico y se aplican enfoques de vulnerabilidad del IPCC y MOVE. Se busca reducir inundaciones, minimizar pérdidas económicas y fortalecer la seguridad pública conforme a los ODS y al POT.',
    year: '2025-30',
    posterUrl: 'https://irislab.blob.core.windows.net/irislabcontainer/1764015710362-POSTER%20ENTREGA%20FINAL%20COMPLETO.pdf?sv=2025-11-05&se=2026-11-24T20%3A21%3A50Z&sr=b&sp=r&sig=WyO8x8R%2FIHMNIpJca0eZhwAcFHpf2kn9vhOMkFHhVdo%3D',
  },
  {
    engineeringId: 3,
    projectTitle: 'Diseño y fabricación de una máquina semiautomática dobladora de varillas de acero, usadas en la elaboración de productos comerciales',
    teamMembers: ['Jaime Besada', 'Juan Abad', 'Kemer Pérez'],
    description: 'MULTICOLOR es una microempresa colombiana ubicada en Barranquilla, Atlántico, dedicada a la fabricación de soportes metálicos. Todos sus productos son realizados mediante métodos manuales, lo cual genera tiempos de fabricación elevados, dependencia de la habilidad del operario y variaciones en la calidad del producto. \r\n\r\nLa empresa MULTICOLOR requiere suplantar los métodos que se realizan de forma manual para el doblez de las varillas, con el objetivo de mejorar su competitividad y capacidad productiva.',
    year: '2025-30',
    posterUrl: 'https://irislab.blob.core.windows.net/irislabcontainer/1764218714694-Poster%20Maquina%20Dobladora%20(1).png?sv=2025-11-05&se=2026-11-27T04%3A45%3A14Z&sr=b&sp=r&sig=zvA%2FlNSmFUxGm5lkjrFLC4LLzRYISqO7YvQhrnoVXqU%3D',
  },
  {
    engineeringId: 4,
    projectTitle: 'Detección de fallas en red enmallada apoyada en inteligencia artificial',
    teamMembers: ['Liliana Lizarazo', 'Louis Sánchez', 'Virginia Rambal'],
    description: 'La operación anómala de los sistemas de protección en redes eléctricas enmalladas representa un desafío crítico para la confiabilidad del suministro, donde factores humanos contribuyen a cerca del 40% de las fallas operativas según la NERC. Este trabajo desarrolla un sistema de detección de fallas basado en inteligencia artificial implementado sobre un prototipo físico IEEE-5 nodos a escala, diseñado para evaluar el desempeño de algoritmos de detección bajo condiciones reales. El diseño de ingeniería consideró criterios técnicos como AUC-ROC, exactitud, F1-score y tasa de falsos negativos, integrados mediante una matriz de decisión para seleccionar la alternativa óptima. El proyecto se enmarcó en estándares internacionales aplicables al análisis y verificación de sistemas eléctricos y dispositivos de protección, incluyendo IEC 60909, IEC 60076, IEC 60255, C37.010-1979 y lineamientos del AI Act (2024). La solución seleccionada fue un clasificador MLP (Perceptrón Multicapa), validado mediante la aplicación física de fallas trifásicas, bifásicas y monofásicas. Durante la validación, el sistema detectó 57 de las 60 fallas ejecutadas (95 %), superando el umbral requerido y evidenciando su viabilidad para aplicaciones de protección. Los resultados evidencian que el proyecto cumplió su objetivo general, confirmando la viabilidad técnica de aplicar técnicas de aprendizaje automático en sistemas de protección en redes enmalladas.',
    year: '2025-30',
    posterUrl: 'https://irislab.blob.core.windows.net/irislabcontainer/1764169735257-Poster.pdf?sv=2025-11-05&se=2026-11-26T15%3A08%3A55Z&sr=b&sp=r&sig=U7g9N9FtG8thGQXgOZSloW14dl1s4p5G9iN7yX1h7Lw%3D',
  },
  {
    engineeringId: 5,
    projectTitle: 'Autonet AI: Automatización de redes de computadores basada en inteligencia artificial',
    teamMembers: ['Carlos Ordoñez', 'Samir Mercado'],
    description: 'Autonet AI es un proyecto que aborda el crítico problema de la gestión manual de redes, responsable del 40% al 70% de las fallas en infraestructuras complejas, y cuyo propósito es demostrar que es posible automatizar tanto la detección como la respuesta ante incidentes de seguridad en un entorno controlado. El sistema integra monitoreo en tiempo real mediante SNMP, modelos de inteligencia artificial y automatización con Ansible para identificar tráfico normal, un ataque de Denegación de Servicio (DoS) y un ataque de fuerza bruta, y aplicar automáticamente configuraciones de mitigación. Su alcance comprende el diseño, entrenamiento y validación de este ciclo completo de supervisión–predicción–respuesta dentro de un laboratorio estableciendo una base escalable y replicable para futuras ampliaciones hacia redes más complejas y escenarios reales.',
    year: '2025-30',
    posterUrl: 'https://irislab.blob.core.windows.net/irislabcontainer/1764189741196-AutoNet_poster.pdf?sv=2025-11-05&se=2026-11-26T20%3A42%3A21Z&sr=b&sp=r&sig=nk3MMEFCpb5%2FupW4WLXhwVuhPUHGpCESqwXqW%2Fl5WBg%3D',
  },
  {
    engineeringId: 6,
    projectTitle: 'Modelo de optimización para la planificación de menús funcionales basados en sinergia alimentaria.',
    teamMembers: ['Daniela Flórez Gonzales', 'Entissar Khorfan Hamdam', 'Valeria Palma Sanjuanelo'],
    description: 'SynFood aborda el alto costo y la complejidad de planear menús personalizados. Usa un modelo de optimización multicriterio que pondera proteína, fibra, omega-3, antioxidantes, carga glucémica y diversidad vegetal según el objetivo del usuario. Genera menús completos en segundos, consistentes y reproducibles, con buena calidad nutricional, cumplimiento de restricciones y acceso web sin costo.',
    year: '2025-30',
    posterUrl: 'https://irislab.blob.core.windows.net/irislabcontainer/1763995772708-Pendon%20proyecto%20final-1.jpg?sv=2025-11-05&se=2026-11-24T14%3A49%3A32Z&sr=b&sp=r&sig=ndhyuBFPmIPXHiGB668Z6Wi4aOXrxMsBtpCmqsmrGtk%3D',
  },
];

export function WinnersSection({ winnersSectionRef }: WinnersSectionProps) {
  const [selectedEngineering, setSelectedEngineering] = useState<number>(1);

  const selectedEngineeringData = engineeringFields.find(
    (field) => field.id === selectedEngineering
  );

  const selectedWinner = winnersData.find(
    (winner) => winner.engineeringId === selectedEngineering
  );

  return (
    <>
      {/* Section Title with Mask Effect */}
      <section className="relative z-10 min-h-[30vh] flex items-center justify-center px-6 py-5">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-sm text-primary mb-6">
            <Trophy className="w-4 h-4" />
            <span>Proyectos Destacados 2025-30</span>
          </div>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-none mb-6">
            Proyectos <span className="prismatic-text">Ganadores</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Descubre la innovación y excelencia que define a cada ingeniería
          </p>
        </div>
      </section>

      {/* Winners Section */}
      <section
        id="ganadores"
        ref={winnersSectionRef}
        className="relative z-10 px-6 py-5 md:px-12"
      >
        <div className="max-w-7xl mx-auto">
          {/* Engineering Filter Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-9 md:mb-16">
            {engineeringFields.filter(field => field.id !== 7).map((field) => {
              const Icon = field.icon;
              const isActive = selectedEngineering === field.id;
              
              return (
                <div
                  key={field.id}
                  onClick={() => setSelectedEngineering(field.id)}
                  className={`
                    group relative cursor-pointer px-6 py-3 rounded-full transition-all duration-500
                    ${isActive ? 'scale-105' : 'scale-100 hover:scale-102'}
                  `}
                  style={{
                    background: 'rgba(18, 18, 28, 0.3)',
                    backdropFilter: 'blur(10px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                    border: `2px solid ${isActive ? field.color : 'rgba(255, 255, 255, 0.1)'}`,
                    boxShadow: isActive
                      ? `0 0 15px ${field.color}, 0 0 30px color-mix(in oklch, ${field.color}, transparent 50%)`
                      : '0 4px 16px 0 rgba(0, 0, 0, 0.37)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className="w-5 h-5"
                      style={{ color: field.color }}
                    />
                    <span
                      className="text-sm font-semibold text-foreground"
                    >
                      {field.name.split(' ').slice(-1)[0]}
                    </span>
                  </div>
                  
                  {/* Hover glow effect */}
                  {!isActive && (
                    <div
                      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${field.color}15, transparent)`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Winner Project Card */}
          {selectedWinner && selectedEngineeringData && (
            <div className="max-w-5xl mx-auto">
              <GlassCard className="overflow-hidden group hover:scale-[1.01] transition-all duration-700">
                {/* Background gradient effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${selectedEngineeringData.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-700`}
                />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{
                            background: `color-mix(in oklch, ${selectedEngineeringData.color}, transparent 80%)`,
                            boxShadow: `0 0 40px color-mix(in oklch, ${selectedEngineeringData.color}, transparent 50%)`,
                          }}
                        >
                          <Trophy
                            className="w-8 h-8"
                            style={{ color: selectedEngineeringData.color }}
                          />
                        </div>
                        <div>
                          <h3
                            className="text-sm font-semibold uppercase tracking-wider"
                            style={{ color: selectedEngineeringData.color }}
                          >
                            {selectedEngineeringData.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Ganador {selectedWinner.year}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Award badge */}
                    <div
                      className="px-4 py-2 rounded-full flex items-center gap-2"
                      style={{
                        background: `color-mix(in oklch, ${selectedEngineeringData.color}, transparent 85%)`,
                      }}
                    >
                      <Star
                        className="w-5 h-5"
                        style={{ color: selectedEngineeringData.color }}
                        fill={selectedEngineeringData.color}
                      />
                      <span
                        className="text-sm font-bold"
                        style={{ color: selectedEngineeringData.color }}
                      >
                        1er Lugar
                      </span>
                    </div>
                  </div>

                  {/* Project Title */}
                  <h4 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {selectedWinner.projectTitle}
                  </h4>

                  {/* Description */}
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    {selectedWinner.description}
                  </p>

                  {/* Team Members */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Equipo
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedWinner.teamMembers.map((member, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 rounded-lg glass-effect hover:glass-effect-strong transition-all duration-300"
                          style={{
                            border: `1px solid color-mix(in oklch, ${selectedEngineeringData.color}, transparent 80%)`,
                          }}
                        >
                          <span className="text-sm font-medium">{member}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <div
                      onClick={() => {
                        window.open(selectedWinner.posterUrl, '_blank');
                      }}
                      className="group/btn cursor-pointer hover:scale-105 transition-all duration-300 px-6 py-3 rounded-lg flex items-center gap-2"
                      style={{
                        background: 'rgba(18, 18, 28, 0.3)',
                        backdropFilter: 'blur(10px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                        border: `2px solid ${selectedEngineeringData.color}`,
                        boxShadow: `0 0 20px color-mix(in oklch, ${selectedEngineeringData.color}, transparent 60%)`,
                      }}
                    >
                      <span
                        className="font-semibold"
                        style={{ color: selectedEngineeringData.color }}
                      >
                        Ver poster del Proyecto
                      </span>
                      <ArrowRight
                        className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"
                        style={{ color: selectedEngineeringData.color }}
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Stats Cards */}
              {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {[
                  { icon: Trophy, label: 'Calificación', value: '98/100' },
                  { icon: Users, label: 'Votos del Jurado', value: '15/15' },
                  { icon: Star, label: 'Impacto', value: 'Muy Alto' },
                ].map((stat, index) => (
                  <GlassCard
                    key={index}
                    className="text-center hover:scale-105 transition-all duration-500"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{
                        background: `color-mix(in oklch, ${selectedEngineeringData.color}, transparent 80%)`,
                        boxShadow: `0 0 20px color-mix(in oklch, ${selectedEngineeringData.color}, transparent 60%)`,
                      }}
                    >
                      <stat.icon
                        className="w-6 h-6"
                        style={{ color: selectedEngineeringData.color }}
                      />
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </GlassCard>
                ))}
              </div> */}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
