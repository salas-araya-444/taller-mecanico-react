from rest_framework import serializers
from .models import Factura


class FacturaSerializer(serializers.ModelSerializer):
    # Datos de la orden para mostrarlos en React (solo lectura)
    vehiculo_placa = serializers.CharField(source='orden.vehiculo.placa', read_only=True)
    cliente_nombre = serializers.CharField(source='orden.vehiculo.cliente.nombre', read_only=True)

    class Meta:
        model = Factura
        fields = '__all__'
        # Solo se envía la orden; el número y los montos los calcula el sistema
        read_only_fields = ['numero', 'fecha', 'subtotal', 'iva', 'total']

#-----------------------------------------------------------------------------------------------

    def validate_orden(self, value):
        if value.estado != 'FINALIZADA':
            raise serializers.ValidationError('Solo se pueden facturar órdenes finalizadas...')
        return value

#-----------------------------------------------------------------------------------------------
