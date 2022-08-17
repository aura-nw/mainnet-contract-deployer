import {
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  export class BaseEntity {
    @CreateDateColumn({
      type: 'timestamp',
      name: 'created_at',
    })
    created_at: Date | undefined;
  
    @UpdateDateColumn({
      type: 'timestamp',
      name: 'updated_at',
    })
    updated_at: Date | undefined;
  }
  
  export class BaseEntityIncrementId extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id = 0;
  }
  