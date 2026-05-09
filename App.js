import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, SafeAreaView, TextInput, Alert } from 'react-native';

export default function App() {
  // --- CONFIGURACIÓN DE DATOS BASE ---
  const habitacionesPorPisoBase = [
    201, 202, 203, 204, 205, 206, 207, 209, "SEP", 
    210, 211, 212, 214, 215, 216, 217, 219, 221, "SEP", 
    223
  ];
  
  const productosConfig = [
    { nombre: "Confite", limite: 0 }, { nombre: "Alfajor", limite: 0 },
    { nombre: "Maní", limite: 0 }, { nombre: "Barra Cereal", limite: 0 },
    { nombre: "Papas", limite: 0 }, { nombre: "Jugo Cajita", limite: 0 },
    { nombre: "Gaseosa", limite: 2 }, { nombre: "Cerveza", limite: 2 },
    { nombre: "Agua s/g", limite: 3 }, { nombre: "Agua c/g", limite: 0 },
    { nombre: "Bebida Saborizada", limite: 0 }
  ];

  // Función para devolver la app al estado original (Zapatos sin caja)
  const crearEstadoLimpio = () => ({
    "Piso 2": habitacionesPorPisoBase.map(h => 
      h === "SEP" ? { tipo: "SEP" } : { id: h, estado: 0, consumos: {} }
    )
  });

  // --- ESTADOS PRINCIPALES ---
  const [dataPisos, setDataPisos] = useState(crearEstadoLimpio());
  const [pisoActual, setPisoActual] = useState("Piso 2");
  const [multiPiso, setMultiPiso] = useState(false); 
  const [editMode, setEditMode] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);
  const [verInforme, setVerInforme] = useState(false);
  const [verNotas, setVerNotas] = useState(false);
  const [notasPorPiso, setNotasPorPiso] = useState({});
  const [textoTemporal, setTextoTemporal] = useState("");

  const colores = ['#3D3D3D', '#4CAF50', '#F44336'];

  // --- LÓGICA DE RESETEO (LA FUNCIÓN QUE LIMPIA TODO) ---
  const ejecutarReset = () => {
    Alert.alert(
      "Resetear Aplicación",
      "¿Deseas borrar todos los colores, notas y consumos registrados?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Borrar Todo", 
          style: "destructive",
          onPress: () => {
            setDataPisos(crearEstadoLimpio());
            setNotasPorPiso({});
            setMultiPiso(false);
            setPisoActual("Piso 2");
            setVerInforme(false);
            setEditMode(false);
          } 
        }
      ]
    );
  };

  // --- LÓGICA DE PISOS Y CONSUMOS ---
  const toggleMultiFloorMode = () => {
    if (!dataPisos["Piso 4"]) {
      const nuevosPisos = {};
      [1, 2, 3, 4].forEach(num => {
        const nombrePiso = `Piso ${num}`;
        let listaHabitaciones = habitacionesPorPisoBase.map(h => 
          h === "SEP" ? { tipo: "SEP" } : { id: h + (num - 2) * 100, estado: 0, consumos: {} }
        );
        if (num === 1) listaHabitaciones.push({ id: 133, estado: 0, consumos: {} });
        else if (num === 3) listaHabitaciones = listaHabitaciones.filter(h => h.id !== 310);
        else if (num === 4) {
          const excluidas = [401, 410, 411, 423, 433];
          listaHabitaciones = listaHabitaciones.filter(h => !excluidas.includes(h.id));
        }
        nuevosPisos[nombrePiso] = dataPisos[nombrePiso] || listaHabitaciones;
      });
      setDataPisos(nuevosPisos);
    }
    setMultiPiso(!multiPiso);
  };

  const alternarColor = (index) => {
    if (!editMode) return;
    const nuevasHabitaciones = [...dataPisos[pisoActual]];
    nuevasHabitaciones[index].estado = (nuevasHabitaciones[index].estado + 1) % 3;
    setDataPisos({ ...dataPisos, [pisoActual]: nuevasHabitaciones });
  };

  const manejarConsumo = (habIndex, prodObj) => {
    const nuevasHabitaciones = [...dataPisos[pisoActual]];
    const hab = nuevasHabitaciones[habIndex];
    const actual = hab.consumos[prodObj.nombre] || 0;
    let limiteFinal = prodObj.limite;

    if (hab.id === 223 || hab.id === 323) {
      if (prodObj.nombre === "Gaseosa") limiteFinal = 4;
      if (prodObj.nombre === "Cerveza") limiteFinal = 4;
      if (prodObj.nombre === "Agua s/g") limiteFinal = 6;
      if (prodObj.nombre === "Agua c/g") limiteFinal = 2;
    }

    if (limiteFinal === 0) {
      hab.consumos[prodObj.nombre] = actual === 0 ? 1 : 0;
    } else {
      hab.consumos[prodObj.nombre] = (actual + 1) % (limiteFinal + 1);
    }
    setDataPisos({ ...dataPisos, [pisoActual]: nuevasHabitaciones });
  };

  const obtenerDatosInforme = () => {
    const informeMap = {};
    Object.keys(dataPisos).sort().forEach(piso => {
      const habsConConsumo = dataPisos[piso].filter(hab => 
        hab.id && Object.values(hab.consumos).some(v => v > 0)
      );
      if (habsConConsumo.length > 0) {
        informeMap[piso] = habsConConsumo.map(hab => {
          const detalle = Object.entries(hab.consumos)
            .filter(([_, v]) => v > 0)
            .map(([n, v]) => `${n}${v > 1 ? ` ${v}` : ""}`)
            .join(", ");
          return `${hab.id} - ${detalle}`;
        });
      }
    });
    return informeMap;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.btnLock, editMode && styles.btnActive]} onPress={() => setEditMode(!editMode)}>
          <Text style={styles.textWhite}>{editMode ? "🔓 EDICIÓN" : "🔒 BLOQUEO"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleMultiFloorMode} style={styles.btnPisos}>
          <Text style={styles.textPisos}>{multiPiso ? "🏢 VER PISO" : "🏢 + PISOS"}</Text>
        </TouchableOpacity>
      </View>

      {multiPiso && (
        <View style={styles.selectorPisos}>
          {Object.keys(dataPisos).sort().map(p => (
            <TouchableOpacity key={p} style={[styles.pisoTab, pisoActual === p && styles.pisoTabActive]} onPress={() => setPisoActual(p)}>
              <Text style={styles.textWhite}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollGrid}>
        <View style={styles.grid}>
          {dataPisos[pisoActual].map((hab, index) => {
            if (hab.tipo === "SEP") return <View key={`sep-${index}`} style={styles.separador} />;
            const tieneConsumo = Object.values(hab.consumos).some(v => v > 0);
            return (
              <TouchableOpacity
                key={hab.id}
                style={[styles.botonHab, { backgroundColor: colores[hab.estado] }]}
                onPress={() => alternarColor(index)}
                onLongPress={() => { if (editMode) setSeleccionada(index); }}
                delayLongPress={500}
              >
                <Text style={styles.textHab}>{hab.id}</Text>
                {tieneConsumo && <Text style={styles.asterisco}>*</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity 
            style={styles.btnAction} 
            onPress={() => {
              setTextoTemporal(notasPorPiso[pisoActual] || "");
              setVerNotas(true);
            }}
          >
            <Text style={styles.textAction}>Observ.</Text>
          </TouchableOpacity>

          {/* BOTÓN RESET VINCULADO CORRECTAMENTE */}
          <TouchableOpacity 
            style={[styles.btnAction, { borderColor: '#F44336' }]} 
            onPress={ejecutarReset}
          >
            <Text style={[styles.textAction, { color: '#F44336' }]}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnAction} onPress={() => setVerInforme(true)}>
            <Text style={styles.textAction}>Info</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODALES (NOTAS, CONSUMO E INFORME) SE MANTIENEN IGUAL */}
      <Modal visible={verNotas} animationType="slide">
        <View style={styles.modalDark}>
          <Text style={styles.modalTitle}>Notas - {pisoActual}</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Escribir notas..."
            placeholderTextColor="#666"
            value={textoTemporal}
            onChangeText={setTextoTemporal}
          />
          <TouchableOpacity 
            style={styles.btnSave} 
            onPress={() => {
              setNotasPorPiso({...notasPorPiso, [pisoActual]: textoTemporal});
              setVerNotas(false);
            }}
          >
            <Text style={styles.textWhite}>GUARDAR NOTA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnClose} onPress={() => setVerNotas(false)}>
            <Text style={styles.textWhite}>CANCELAR</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* MODAL CONSUMO */}
      <Modal visible={seleccionada !== null} animationType="fade">
        <View style={styles.modalDark}>
          <Text style={styles.modalTitle}>Hab {dataPisos[pisoActual][seleccionada]?.id}</Text>
          <ScrollView>
            {productosConfig.map(prod => {
              const val = dataPisos[pisoActual][seleccionada]?.consumos[prod.nombre] || 0;
              return (
                <TouchableOpacity key={prod.nombre} style={styles.prodRow} onPress={() => manejarConsumo(seleccionada, prod)}>
                  <Text style={[styles.prodName, val > 0 && styles.textGreen]}>{prod.nombre}</Text>
                  <View style={[styles.check, val > 0 && styles.checkActive]}>
                    <Text style={styles.textWhite}>{prod.limite > 0 || (dataPisos[pisoActual][seleccionada]?.id % 100 === 23 && ["Gaseosa", "Cerveza", "Agua s/g", "Agua c/g"].includes(prod.nombre)) ? val : (val > 0 ? "✓" : "")}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.btnClose} onPress={() => setSeleccionada(null)}><Text style={styles.textWhite}>VOLVER</Text></TouchableOpacity>
        </View>
      </Modal>

      {/* MODAL INFORME */}
      <Modal visible={verInforme} animationType="slide">
        <View style={styles.modalDark}>
          <Text style={styles.modalTitle}>Resumen de Consumos</Text>
          <ScrollView>
            {Object.keys(obtenerDatosInforme()).length === 0 ? (
              <Text style={styles.reporteText}>No hay consumos registrados.</Text>
            ) : (
              Object.entries(obtenerDatosInforme()).map(([piso, habitaciones]) => (
                <View key={piso} style={styles.pisoSeccion}>
                  <Text style={styles.pisoTitulo}>{piso}:</Text>
                  {habitaciones.map((linea, i) => (
                    <Text key={i} style={styles.reporteText}>{linea}</Text>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={styles.btnClose} onPress={() => setVerInforme(false)}><Text style={styles.textWhite}>CERRAR</Text></TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 50, paddingHorizontal: 20 },
  btnLock: { padding: 12, backgroundColor: '#333', borderRadius: 10, width: '45%', alignItems: 'center' },
  btnPisos: { padding: 12, backgroundColor: '#2D2D2D', borderRadius: 10, width: '45%', alignItems: 'center', borderWidth: 1, borderColor: '#555' },
  textPisos: { color: '#8AB4F8', fontWeight: 'bold' },
  btnActive: { borderColor: '#4CAF50', borderWidth: 1 },
  selectorPisos: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 },
  pisoTab: { padding: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#333' },
  pisoTabActive: { backgroundColor: '#8AB4F8' },
  scrollGrid: { flexGrow: 1, justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 10 },
  botonHab: { width: 85, height: 85, margin: 8, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  separador: { width: '100%', height: 25 },
  textHab: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
  asterisco: { position: 'absolute', bottom: 3, fontSize: 22, color: '#FFF', fontWeight: 'bold' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: '8%', paddingBottom: 40, marginTop: 20 },
  btnAction: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#4CAF50' },
  textAction: { color: '#4CAF50', fontWeight: 'bold' },
  modalDark: { flex: 1, backgroundColor: '#1E1E1E', padding: 30, paddingTop: 60 },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  textArea: { backgroundColor: '#333', color: '#FFF', padding: 15, borderRadius: 12, height: 200, fontSize: 16, textAlignVertical: 'top' },
  btnSave: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 25 },
  btnClose: { backgroundColor: '#333', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  pisoSeccion: { marginBottom: 20 },
  pisoTitulo: { color: '#8AB4F8', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  prodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  prodName: { color: '#CCC', fontSize: 18, flex: 1 },
  textGreen: { color: '#4CAF50', fontWeight: 'bold' },
  check: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, borderColor: '#555', justifyContent: 'center', alignItems: 'center' },
  checkActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  reporteText: { color: '#FFF', fontSize: 16, lineHeight: 26, marginLeft: 10 },
  textWhite: { color: '#FFF', fontWeight: 'bold' }
});