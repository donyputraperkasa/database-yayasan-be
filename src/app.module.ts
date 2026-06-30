import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchoolsModule } from './schools/schools.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SchoolProfileModule } from './school-profile/school-profile.module';
import { EmployeesModule } from './employees/employees.module';
import { StudentsModule } from './students/students.module';
import { AssetsModule } from './assets/assets.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { FinancesModule } from './finances/finances.module';
import { DocumentsModule } from './documents/documents.module';
import { ContactsModule } from './contacts/contacts.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AssetsModule,
    AuthModule,
    ContactsModule,
    DashboardModule,
    DocumentsModule,
    EmployeesModule,
    FacilitiesModule,
    FinancesModule,
    PrismaModule,
    SchoolProfileModule,
    SchoolsModule,
    StudentsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
