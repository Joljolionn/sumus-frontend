import webbrowser
import time

base = "http://localhost:3000"
urls = [
    base,
    base + "/login",
    base + "/passenger/signup/1",
    base + "/passenger/signup/2",
    base + "/passenger/signup/3",
    base + "/passenger/login",
    base + "/passenger",
    base + "/passenger/config",
    base + "/passenger/cards",
    base + "/passenger/profile",

    base + "/driver/signup/1",
    base + "/driver/signup/2",
    base + "/driver/signup/3",
    base + "/driver/login",
    base + "/driver",
    base + "/driver/config",
    base + "/driver/cards",
    base + "/driver/profile",
    base + "/driver/documents",
    base + "/driver/otp",
    base + "/driver/history",
    base + "/driver/payments",
    base + "/driver/vehicles",

    base + "/admin",
    base + "/admin/management",
    base + "/admin/approval/driver",
    base + "/admin/approval/passenger",
    base + "/admin/login",

    
]

def abrir_links(lista_urls):
    print(f"Iniciando a abertura de {len(lista_urls)} links...")
    
    for url in lista_urls:
        webbrowser.open(url)
        
        time.sleep(1) 

    print("Concluído!")

if __name__ == "__main__":
    abrir_links(urls)
