-- CreateTable
CREATE TABLE "PredefinedDiagnostic" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "commonSymptoms" TEXT NOT NULL,
    "recommendedTreatment" TEXT NOT NULL,
    "observations" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredefinedDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PredefinedDiagnostic_code_key" ON "PredefinedDiagnostic"("code");

-- CreateIndex
CREATE INDEX "PredefinedDiagnostic_category_idx" ON "PredefinedDiagnostic"("category");

-- CreateIndex
CREATE INDEX "PredefinedDiagnostic_severity_idx" ON "PredefinedDiagnostic"("severity");

-- InsertData
INSERT INTO "PredefinedDiagnostic" ("id", "code", "name", "description", "commonSymptoms", "recommendedTreatment", "observations", "category", "severity", "createdAt", "updatedAt") VALUES
('550e8400-e29b-41d4-a716-446655440101', 'J00', 'Rinofaringitis aguda (resfriado común)', 'Infección viral del tracto respiratorio superior', 'Congestión nasal, estornudos, dolor de garganta, tos leve, malestar general', 'Reposo, hidratación abundante, analgésicos como paracetamol, descongestionantes nasales', 'Generalmente autolimitada, duración 7-10 días', 'Respiratorio', 'Leve', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440102', 'J06.9', 'Infección aguda de las vías respiratorias superiores', 'Infección viral o bacteriana de vías aéreas superiores', 'Fiebre, dolor de garganta, tos, rinorrea, cefalea', 'Antipiréticos, reposo, líquidos abundantes, antibióticos solo si hay evidencia bacteriana', 'Vigilar signos de complicación', 'Respiratorio', 'Leve', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440103', 'A09', 'Gastroenteritis y colitis de origen infeccioso', 'Inflamación del tracto gastrointestinal por agentes infecciosos', 'Diarrea, náuseas, vómitos, dolor abdominal, fiebre', 'Hidratación oral o intravenosa, dieta blanda, probióticos, antieméticos si necesario', 'Monitorear deshidratación especialmente en niños y ancianos', 'Gastrointestinal', 'Moderado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440104', 'E11.9', 'Diabetes mellitus tipo 2 no especificada', 'Trastorno metabólico caracterizado por hiperglucemia crónica', 'Poliuria, polidipsia, polifagia, pérdida de peso, fatiga', 'Modificación del estilo de vida, metformina, control glucémico regular, dieta y ejercicio', 'Requiere seguimiento continuo y educación del paciente', 'Endocrino', 'Grave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440105', 'I10', 'Hipertensión arterial esencial', 'Presión arterial elevada de forma crónica sin causa identificable', 'Generalmente asintomática, puede presentar cefalea, mareos', 'Antihipertensivos (IECA, ARA-II, diuréticos), reducción de sodio, ejercicio regular', 'Control periódico de presión arterial, evaluación de órganos diana', 'Cardiovascular', 'Grave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440106', 'K21.9', 'Enfermedad por reflujo gastroesofágico', 'Retorno del contenido gástrico al esófago', 'Pirosis, regurgitación, dolor torácico, tos crónica', 'Inhibidores de bomba de protones, antiácidos, elevación cabecera cama, evitar alimentos irritantes', 'Modificaciones del estilo de vida son fundamentales', 'Gastrointestinal', 'Moderado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440107', 'M79.3', 'Fibromialgia', 'Síndrome de dolor musculoesquelético crónico generalizado', 'Dolor generalizado, fatiga, trastornos del sueño, rigidez matutina', 'Analgésicos, antidepresivos tricíclicos, pregabalina, ejercicio gradual, terapia cognitivo-conductual', 'Manejo multidisciplinario, educación del paciente', 'Musculoesquelético', 'Moderado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440108', 'F41.9', 'Trastorno de ansiedad no especificado', 'Estado de ansiedad excesiva y preocupación persistente', 'Nerviosismo, tensión muscular, taquicardia, sudoración, dificultad para concentrarse', 'Psicoterapia, técnicas de relajación, ansiolíticos si necesario, ejercicio regular', 'Considerar derivación a salud mental', 'Mental', 'Moderado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440109', 'M54.5', 'Dolor lumbar bajo', 'Dolor en región lumbar de la columna', 'Dolor en zona lumbar, rigidez, limitación de movimiento', 'Analgésicos, antiinflamatorios, fisioterapia, ejercicios de fortalecimiento', 'Identificar causas mecánicas o posturales', 'Musculoesquelético', 'Leve', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440110', 'R51', 'Cefalea', 'Dolor de cabeza de diversas etiologías', 'Dolor de cabeza, puede ser pulsátil, opresivo o punzante', 'Analgésicos (paracetamol, ibuprofeno), identificar desencadenantes, descanso', 'Descartar cefalea secundaria si hay signos de alarma', 'Neurológico', 'Leve', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440111', 'L20.9', 'Dermatitis atópica no especificada', 'Enfermedad inflamatoria crónica de la piel', 'Prurito intenso, piel seca, lesiones eccematosas, enrojecimiento', 'Emolientes, corticoides tópicos, antihistamínicos, evitar irritantes', 'Cuidado diario de la piel, identificar alérgenos', 'Dermatológico', 'Moderado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440112', 'N39.0', 'Infección de vías urinarias', 'Infección bacteriana del tracto urinario', 'Disuria, polaquiuria, urgencia urinaria, dolor suprapúbico, hematuria', 'Antibióticos (ciprofloxacino, nitrofurantoína), hidratación abundante', 'Realizar urocultivo, valorar infecciones recurrentes', 'Urológico', 'Moderado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440113', 'H10.9', 'Conjuntivitis no especificada', 'Inflamación de la conjuntiva ocular', 'Enrojecimiento ocular, lagrimeo, secreción, sensación de cuerpo extraño', 'Lágrimas artificiales, compresas frías, antibióticos tópicos si es bacteriana', 'Evaluar si es viral, bacteriana o alérgica', 'Oftalmológico', 'Leve', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440114', 'E78.5', 'Hiperlipidemia no especificada', 'Elevación de lípidos en sangre', 'Generalmente asintomática', 'Estatinas, fibratos, dieta baja en grasas saturadas, ejercicio', 'Control de perfil lipídico, evaluar riesgo cardiovascular', 'Metabólico', 'Grave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440115', 'J45.9', 'Asma no especificada', 'Enfermedad inflamatoria crónica de vías aéreas', 'Disnea, sibilancias, tos, opresión torácica', 'Broncodilatadores, corticoides inhalados, evitar desencadenantes', 'Plan de acción para crisis asmáticas', 'Respiratorio', 'Grave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440116', 'E66.9', 'Obesidad no especificada', 'Acumulación excesiva de grasa corporal', 'IMC >30, puede ser asintomática o causar fatiga, disnea de esfuerzo', 'Dieta hipocalórica, ejercicio regular, cambios en estilo de vida, considerar farmacoterapia', 'Manejo multidisciplinario a largo plazo', 'Metabólico', 'Moderado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440117', 'K80.2', 'Colelitiasis sin colecistitis', 'Presencia de cálculos en vesícula biliar', 'Dolor en hipocondrio derecho post-prandial, náuseas, intolerancia a alimentos grasos', 'Dieta baja en grasas, analgésicos, colecistectomía electiva si síntomas recurrentes', 'Vigilar complicaciones como colecistitis aguda', 'Gastrointestinal', 'Moderado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440118', 'F32.9', 'Episodio depresivo no especificado', 'Trastorno del estado de ánimo caracterizado por tristeza persistente', 'Tristeza, anhedonia, alteraciones del sueño, fatiga, pérdida de apetito', 'Antidepresivos (ISRS), psicoterapia, apoyo social', 'Evaluación del riesgo suicida, seguimiento estrecho', 'Mental', 'Grave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440119', 'M25.5', 'Dolor articular', 'Dolor en articulaciones de diversas etiologías', 'Dolor, rigidez articular, puede haber inflamación', 'Antiinflamatorios, reposo relativo, fisioterapia', 'Investigar causa subyacente (artritis, artrosis)', 'Musculoesquelético', 'Moderado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('550e8400-e29b-41d4-a716-446655440120', 'R10.4', 'Dolor abdominal no especificado', 'Dolor en región abdominal de causa a determinar', 'Dolor abdominal variable en localización e intensidad', 'Analgésicos, antiespasmódicos, investigar causa', 'Descartar abdomen agudo, realizar estudios complementarios', 'Gastrointestinal', 'Moderado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
