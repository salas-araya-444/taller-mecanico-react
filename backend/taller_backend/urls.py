from django.contrib import admin
from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token

from clientes.views import logout_api, mecanicos_api, perfil_api
from facturacion.views import reportes_api

urlpatterns = [
    path('admin/', admin.site.urls),

    # Login (token), perfil del usuario y cierre de sesión
    path('api/token/', obtain_auth_token, name='api-token'),
    path('api/perfil/', perfil_api, name='perfil_api'),
    path('api/logout/', logout_api, name='logout_api'),

    # Lista de mecánicos para los select de React y reportes del administrador
    path('api/mecanicos/', mecanicos_api, name='mecanicos_api'),
    path('api/reportes/', reportes_api, name='reportes_api'),

    # CRUD de cada módulo (cada app tiene su propio urls.py)
    path('api/clientes/', include('clientes.urls')),
    path('api/vehiculos/', include('vehiculos.urls')),
    path('api/repuestos/', include('repuestos.urls')),
    path('api/ordenes/', include('ordenes.urls')),
    path('api/facturas/', include('facturacion.urls')),
]
