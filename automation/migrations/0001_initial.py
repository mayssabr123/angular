# Generated by Django 4.2.20 on 2025-04-18 12:08

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SensorData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sensor_id', models.CharField(max_length=50)),
                ('temperature', models.FloatField(blank=True, null=True)),
                ('humidity', models.FloatField(blank=True, null=True)),
                ('gas', models.FloatField(blank=True, null=True)),
                ('light', models.FloatField(blank=True, null=True)),
                ('presence', models.BooleanField(default=False)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
