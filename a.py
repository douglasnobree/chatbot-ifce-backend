import matplotlib.pyplot as plt
import pandas as pd

# Função para coletar dados
def coletar_dados():
    dados = []
    n = int(input("Quantos pontos de coleta? "))
    
    for i in range(n):
        print(f"\nPonto {i+1}")
        local = input("Localização/Vão/Lance: ")
        r1 = float(input("R1: "))
        r2 = float(input("R2: "))
        r3 = float(input("R3: "))
        r4 = float(input("R4: "))
        media = (r1 + r2 + r3 + r4) / 4
        dados.append({
            "Local": local,
            "R1": r1,
            "R2": r2,
            "R3": r3,
            "R4": r4,
            "Média": media
        })
    
    return pd.DataFrame(dados)

# Função para gerar gráfico
def gerar_grafico(df):
    df.plot(x="Local", y=["R1", "R2", "R3", "R4", "Média"], kind="bar", figsize=(10,6))
    plt.title("Lâmina Coletada por Ponto")
    plt.xlabel("Local")
    plt.ylabel("Lâmina (mm)")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.grid(True)
    plt.legend()
    plt.show()

# Execução
df = coletar_dados()
print("\nResumo dos Dados:")
print(df)
gerar_grafico(df)
