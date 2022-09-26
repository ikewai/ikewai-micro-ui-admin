import { Inject, Component } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormArray } from '@angular/forms';

@Component({
    selector: 'admin-edit-dialog',
    templateUrl: 'editDialog.component.html',
    styleUrls: ['./editDialog.component.css'],
  })

  export class AdminEditDialog {

    selectedData = {
      status: null
    }
    dataMap = {};
    sampleSpecifications = {
      '16s': true,
      'WGS': true,
      'qPCR': true,
      'Cultured Data': true
    }

    name = "";
    affiliation: "";

    requestObject = {
      name: "",
      sampleSpecifications: this.sampleSpecifications,
      requestedSamples: [],
    };
    
    constructor(
    public dialogRef: MatDialogRef<AdminEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any, private fb: FormBuilder) { 
      this.selectedData = data;
      console.log(data, 'from the modal')

      for (let i = 0; i < data.selectedData.length; i++) {
        this.dataMap[data.selectedData[i]] = true;
      }
    }
    
    onNoClick(): void {
      this.dialogRef.close();
    }

    selectSample(e, item) {
      this.dataMap[item.value.id] = e.target.checked;
      this.selectedData = this.data.filter((item: any) => this.dataMap[item.value.id]).map((item: any) => item.value.id);
    }

    toggleSpecs(e: any, choice: string) {
      this.sampleSpecifications[choice] = e.target.checked;
      this.requestObject.sampleSpecifications = this.sampleSpecifications;
    }

    keyEvent(e) {
      this.requestObject.name = this.name;
    }

    profileForm = this.fb.group({
      sampleSpecifications: this.fb.group({
        '16s': [true],
        'WGS': [true],
        'qPCR': [true],
        'Cultured Data': [true]
      }),
    });

    approve() {
      this.selectedData.status = 'APPROVED'
    }

    reject() {
      this.selectedData.status = 'REJECTED'
    }
  
  
  onSubmit() {
    const data = {...this.profileForm.value, selectedData: this.selectedData, isValidRequest: this.profileForm.status === 'VALID' ? true : false}
    this.dialogRef.close(data);
  }
    
  }