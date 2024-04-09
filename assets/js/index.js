const api_url = 'https://mindicador.cl/api/';
let myCanvaChart = null;
let allMonedas = []
let loading = true

const get_monedas = async (url) => {
    try {

        toggleLoading(); 
        const monedas_data = await fetch(url)
        const monedas = await monedas_data.json()
        const monedasFiltradas = Object.keys(monedas).filter(indicador => monedas[indicador]['unidad_medida'] === 'Pesos')

        const monedas_info = monedasFiltradas.map(moneda => ({
            codigo: monedas[moneda]['codigo'],
            nombre: monedas[moneda]['nombre'],
            valor: monedas[moneda]['valor']
        }))

        const selectContainer = document.querySelector('#monedas')
        monedas_info.forEach(moneda => {
            selectContainer.innerHTML += `
                <option value="${moneda.codigo}">${moneda.nombre}</option>
            `
        })
        await Promise.all(monedas_info.map(async moneda => {
            const moneda_data = await get_moneda_data(moneda.codigo);
            allMonedas.push({
                ...moneda,
                data: {
                    [moneda.codigo]: moneda_data
                }
            });
        }));
        loading = false
        toggleLoading();
    } catch (error) {
        console.log(error)
    }
}

function toggleLoading() {
    const mainContainer = document.getElementById("main-container");
    const loadingMessage = document.getElementById("loading");
    const syncMessage = document.getElementById("sync-message"); 

    if (loading) {
        mainContainer.style.display = "none";
        loadingMessage.style.display = "block";
        syncMessage.style.display = "block"; 
    } else {
        mainContainer.style.display = "block";
        loadingMessage.style.display = "none";
        syncMessage.style.display = "none"; 
    }
}

const get_moneda_data = async (moneda_nombre) => {
    const monedas_data = await fetch(`${api_url}${moneda_nombre}`)

    const monedas = await monedas_data.json()
    const data_filtrada = monedas.serie.splice(0, 10)
    data_filtrada.forEach((moneda_dato) => {
        moneda_dato.fecha = moneda_dato.fecha.split('T')[0]
    
    })

    return data_filtrada
}

const get_moneda_price = async (moneda_nombre) => {
    let array_prices = allMonedas.find(moneda => moneda.codigo === moneda_nombre).data[moneda_nombre].map(moneda => moneda.valor)
    return array_prices[0]
}

const calcularConversion = async () => {
    try {
        const clp = parseFloat(document.querySelector('#clp').value);
        const moneda_nombre = document.querySelector('#monedas').value;
        const valor_moneda = await get_moneda_price(moneda_nombre);

        const resultado = clp / valor_moneda;

     
        document.getElementById("resultado").innerText = `Resultado: ${resultado.toFixed(2)} ${moneda_nombre.toUpperCase()}`;
    } catch (error) {
        console.log(error);
        document.getElementById("resultado").innerText = `Error: ${error.message}`;
    }
}

document.querySelector('#calcular').addEventListener('click', calcularConversion)

document.querySelector('#monedas').addEventListener('change', async function (event) {

    const moneda_nombre = event.target.value

    document.getElementById('loading').innerText = 'Cargando...'

    if (myCanvaChart) {
        myCanvaChart.destroy()
    }

    document.getElementById('loading').innerText = ''

    const labels = allMonedas.find(moneda => moneda.codigo === moneda_nombre).data[moneda_nombre].map(moneda => moneda.fecha)
    const data = allMonedas.find(moneda => moneda.codigo === moneda_nombre).data[moneda_nombre].map(moneda => moneda.valor)

    const datasets = [
        {
            label: "Indicadores",
            borderColor: "rgb(255, 99, 132)",
            data
        }
    ];

    const data_render = { labels, datasets };

    handleRenderChart(data_render)
})




const handleRenderChart = (data) => {

    const config = {
        type: "line",
        data
    };

    const myChart = document.getElementById("myChart");

    myChart.style.backgroundColor = "white";

    myCanvaChart = new Chart(myChart, config);
}

get_monedas(api_url)


